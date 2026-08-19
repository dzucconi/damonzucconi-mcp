#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = process.env.MCP_URL ?? "http://127.0.0.1:8787";

function readDevVars() {
  const path = resolve(import.meta.dirname, "..", ".dev.vars");
  const values = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const TOKEN = process.env.MCP_AUTH_TOKEN ?? readDevVars().MCP_AUTH_TOKEN;

if (!TOKEN) throw new Error("MCP_AUTH_TOKEN is required");

const health = await fetch(BASE);
if (!health.ok) throw new Error(`health check failed: ${health.status}`);
const healthJson = await health.json();
if (!healthJson.ok) throw new Error("health check returned not ok");
console.log("health", healthJson);

const unauthorized = await fetch(`${BASE}/mcp`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
});
if (unauthorized.status !== 401) {
  throw new Error(`expected 401 without token, got ${unauthorized.status}`);
}
console.log("auth gate 401");

const client = new Client({ name: "smoke", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`), {
  requestInit: {
    headers: { authorization: `Bearer ${TOKEN}` },
  },
});
await client.connect(transport);
console.log("initialize", client.getServerVersion());

const { tools } = await client.listTools();
if (!tools.length) throw new Error("server returned no tools");
const forbidden = ["delete_artwork", "delete_exhibition", "graphql"];
const exposedForbiddenTools = forbidden.filter((name) => tools.some((tool) => tool.name === name));
if (exposedForbiddenTools.length) {
  throw new Error(`forbidden tools exposed: ${exposedForbiddenTools.join(", ")}`);
}
console.log(
  "tools",
  tools.length,
  tools.map((tool) => tool.name).join(", "),
);

const artworks = await client.callTool({
  name: "list_artworks",
  arguments: { query: "Photosensitivity", state: ["PUBLISHED"] },
});
if (artworks.isError) throw new Error("list_artworks returned an error");
console.log("list_artworks", JSON.stringify(artworks.content).slice(0, 300));

const status = await client.callTool({ name: "status", arguments: {} });
if (status.isError) throw new Error("status returned an error");
console.log("status", JSON.stringify(status.content));

await client.close();
console.log("ok");
