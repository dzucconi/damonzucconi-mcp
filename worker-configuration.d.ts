interface Env {
  GRAPH_ENDPOINT: string;
  MCP_AUTH_TOKEN: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  props?: unknown;
}

interface ExportedHandler<Env = unknown> {
  fetch?(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response>;
}
