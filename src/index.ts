import { createMcpHandler } from "agents/mcp/server";
import { CORS_HEADERS, isAuthorized } from "./auth";
import { createServer } from "./server";

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({ ok: true, service: "damonzucconi-mcp" });
    }

    if (!isAuthorized(request, env.MCP_AUTH_TOKEN)) {
      return json({ error: "Unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
    }

    return createMcpHandler(() => createServer(env), {
      route: "/mcp",
      allowedOriginHostnames: "*",
    })(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
