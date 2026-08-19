import { McpServer } from "@modelcontextprotocol/server";
import { GraphQLClient } from "./graphql";
import { registerArtworkTools } from "./tools/artworks";
import { registerExhibitionTools } from "./tools/exhibitions";
import { registerMiscTools } from "./tools/misc";
import { registerTagTools } from "./tools/tags";

export function createServer(env: Env): McpServer {
  const server = new McpServer({
    name: "damonzucconi",
    version: "1.0.0",
    title: "Damon Zucconi site CMS",
  });
  const gql = new GraphQLClient(env);

  registerArtworkTools(server, gql);
  registerExhibitionTools(server, gql);
  registerTagTools(server, gql);
  registerMiscTools(server, gql);

  return server;
}
