import { createMcpHandler } from "agents/mcp/server";
import { isAuthorized } from "./auth";
import { createServer } from "./server";

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...extra,
    },
  });
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({ ok: true, service: "damonzucconi-mcp" });
    }

    if (url.pathname !== "/mcp") {
      return json({ error: "Not found" }, 404);
    }

    const handler = createMcpHandler(() => createServer(env), { route: "/mcp" });
    if (request.method === "OPTIONS") {
      return handler(request, env, ctx);
    }

    if (!isAuthorized(request, env.MCP_AUTH_TOKEN)) {
      return json({ error: "Unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
    }

    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
