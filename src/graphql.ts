import {
  GenerateTokenDocument,
  type GenerateTokenMutation,
  type GenerateTokenMutationVariables,
  type TypedDocumentString,
} from "./generated/graphql";

type GraphQLError = {
  message: string;
  extensions?: { code?: string };
};

type GraphQLResponse<T> = {
  data?: T | null;
  errors?: GraphQLError[];
};

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cache: CachedToken | undefined;
let loginInFlight: Promise<string> | undefined;

export class GraphQLErrorResponse extends Error {
  readonly codes: string[];

  constructor(errors: GraphQLError[]) {
    super(errors.map((error) => error.message).join("; "));
    this.name = "GraphQLErrorResponse";
    this.codes = errors.map((error) => error.extensions?.code).filter((code): code is string => Boolean(code));
  }

  get unauthenticated(): boolean {
    return this.codes.includes("UNAUTHENTICATED");
  }
}

export class GraphQLClient {
  constructor(private readonly env: Env) {}

  async query<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    return this.request<TResult>(document.toString(), variables, { auth: false });
  }

  async mutate<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    return this.request<TResult>(document.toString(), variables, { auth: true });
  }

  private async request<T>(
    query: string,
    variables: unknown,
    options: { auth: boolean },
  ): Promise<T> {
    const token = options.auth ? await this.getToken() : this.peekToken();

    try {
      return await this.post<T>(query, variables, token);
    } catch (error) {
      if (options.auth && error instanceof GraphQLErrorResponse && error.unauthenticated) {
        cache = undefined;
        const retryToken = await this.getToken({ force: true });
        return this.post<T>(query, variables, retryToken);
      }
      throw error;
    }
  }

  private peekToken(): string | undefined {
    if (cache && cache.expiresAt > Date.now() + 60_000) {
      return cache.token;
    }
    return undefined;
  }

  private async getToken(options: { force?: boolean } = {}): Promise<string> {
    if (!options.force) {
      const existing = this.peekToken();
      if (existing) return existing;
    }

    if (loginInFlight) return loginInFlight;

    loginInFlight = this.login().finally(() => {
      loginInFlight = undefined;
    });

    return loginInFlight;
  }

  private async login(): Promise<string> {
    const variables: GenerateTokenMutationVariables = {
      input: {
        credentials: {
          username: this.env.ADMIN_USERNAME,
          password: this.env.ADMIN_PASSWORD,
        },
      },
    };
    const data = await this.post<GenerateTokenMutation>(GenerateTokenDocument.toString(), variables);

    const payload = data.generate_token;
    if (!payload?.token) {
      throw new Error("Login failed: API did not return a token");
    }

    const parsed = payload.expires_at ? Date.parse(payload.expires_at) : Number.NaN;
    cache = {
      token: payload.token,
      expiresAt: Number.isFinite(parsed) ? parsed : Date.now() + 23 * 60 * 60 * 1000,
    };

    return payload.token;
  }

  private async post<T>(query: string, variables?: unknown, token?: string): Promise<T> {
    const response = await fetch(this.env.GRAPH_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const text = await response.text();
    let json: GraphQLResponse<T>;
    try {
      json = JSON.parse(text) as GraphQLResponse<T>;
    } catch {
      throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 500)}`);
    }

    if (json.errors?.length) {
      throw new GraphQLErrorResponse(json.errors);
    }

    if (!response.ok) {
      throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 500)}`);
    }

    if (json.data == null) {
      throw new Error("Empty GraphQL response");
    }

    return json.data;
  }
}

export type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

export function asText(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function asError(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: message }], isError: true };
}

export async function runTool(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return asText(await fn());
  } catch (error) {
    return asError(error);
  }
}

export function unwrap<T>(value: T | null | undefined, label: string): T {
  if (value == null) {
    throw new Error(`${label} returned null`);
  }
  return value;
}
