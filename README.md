# damonzucconi-mcp

Remote MCP server for managing [damonzucconi.com](https://www.damonzucconi.com) through its [GraphQL API](https://api.damonzucconi.com/graph).

Production endpoint: `https://damonzucconi-mcp.damonzucconi.workers.dev/mcp`

The server is one stateless Cloudflare Worker with no storage bindings. A static bearer token protects the MCP endpoint. The Worker signs into the GraphQL API with the existing admin credentials and caches the resulting JWT until shortly before expiry.

It exposes tools for artworks, exhibitions, tags, nested entities, and ordering, plus a raw authenticated `graphql` escape hatch. The escape hatch has full admin access; prefer the narrower tools.

## Local development

Requires Node.js 20+ and npm.

```bash
npm install
cp .dev.vars.example .dev.vars
```

Set the three secrets in `.dev.vars`:

```bash
openssl rand -hex 32
```

```dotenv
MCP_AUTH_TOKEN=<paste-generated-value>
ADMIN_USERNAME=your-api-admin-username
ADMIN_PASSWORD=your-api-admin-password
```

```bash
npm run codegen
npm run typecheck
npm run dev
```

The local MCP endpoint is `http://127.0.0.1:8787/mcp`. In another terminal:

```bash
npm run smoke
```

To test production instead:

```bash
MCP_URL=https://damonzucconi-mcp.damonzucconi.workers.dev npm run smoke
```

## Connect from Cursor

Add this to `.cursor/mcp.json` for this project or `~/.cursor/mcp.json` globally:

```jsonc
{
  "mcpServers": {
    "damonzucconi": {
      "url": "https://damonzucconi-mcp.damonzucconi.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${env:DAMONZUCCONI_MCP_TOKEN}"
      }
    }
  }
}
```

Set `DAMONZUCCONI_MCP_TOKEN` in the environment Cursor inherits, using the same value as `MCP_AUTH_TOKEN` in `.dev.vars`, then restart Cursor. Remote servers do not support `envFile`.

## Deploy

Wrangler authentication opens a browser:

```bash
npx wrangler login
```

For a first deployment:

```bash
npm run deploy
npm run secrets:push
```

`secrets:push` uploads the three entries from `.dev.vars`. On later deployments, run only `npm run deploy` unless a secret changed.

Before deploying changes:

```bash
npm run codegen
npm run typecheck
npm run smoke
npm run deploy
MCP_URL=https://damonzucconi-mcp.damonzucconi.workers.dev npm run smoke
```

## GraphQL code generation

Queries and mutations live in `src/graphql/`. `npm run codegen` introspects the live API and refreshes:

- `schema.graphql`
- `src/generated/`

Do not edit generated files. If codegen or type checking fails after an API change, update the `.graphql` operations or their Zod tool schemas before deploying.
