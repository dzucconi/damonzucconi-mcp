# damonzucconi-mcp

Remote MCP server for managing [damonzucconi.com](https://www.damonzucconi.com) through its [GraphQL API](https://api.damonzucconi.com/graph).

Production endpoint: `https://damonzucconi-mcp.damonzucconi.workers.dev/mcp`

The server is one stateless Cloudflare Worker with no storage bindings. A static bearer token protects the MCP endpoint. The Worker signs into the GraphQL API with the existing admin credentials and caches the resulting JWT until shortly before expiry.

It exposes tools for artworks, exhibitions, tags, nested entities, and ordering. Artwork and exhibition deletion are intentionally unavailable; perform those manually.

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

## Connect from ChatGPT desktop

The ChatGPT desktop app shares MCP configuration with Codex in `~/.codex/config.toml`. Add:

```toml
[mcp_servers.damonzucconi]
url = "https://damonzucconi-mcp.damonzucconi.workers.dev/mcp"
bearer_token_env_var = "DAMONZUCCONI_MCP_TOKEN"
default_tools_approval_mode = "writes"
```

On macOS, make the token available to apps launched from Finder or the Dock:

```bash
read -s "DAMONZUCCONI_MCP_TOKEN?MCP token: "
echo
launchctl setenv DAMONZUCCONI_MCP_TOKEN "$DAMONZUCCONI_MCP_TOKEN"
unset DAMONZUCCONI_MCP_TOKEN
```

Paste the same value as `MCP_AUTH_TOKEN` when prompted by `read`. The token is not written to `config.toml` or shell history.

Fully quit and reopen ChatGPT, then open **Settings → MCP servers** and select **Restart**. Type `/mcp` in the composer to confirm that `damonzucconi` is connected. See OpenAI's [MCP documentation](https://learn.chatgpt.com/docs/extend/mcp) if the desktop UI changes.

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
