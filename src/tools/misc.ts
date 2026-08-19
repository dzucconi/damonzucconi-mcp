import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { ReorderImageDocument, StatusDocument } from "../generated/graphql";
import { GraphQLClient, runTool, unwrap } from "../graphql";
import { OrderableActionSchema } from "../schema";

export function registerMiscTools(server: McpServer, gql: GraphQLClient): void {
  server.registerTool(
    "status",
    {
      title: "API status",
      description: "Check that the GraphQL API is up and that admin login succeeded (authenticated: true).",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () =>
      runTool(async () => {
        const data = await gql.mutate(StatusDocument, {});
        return data.status;
      }),
  );

  server.registerTool(
    "reorder_image",
    {
      title: "Reorder image",
      description:
        "Reorder an image on an artwork or exhibition. id is the image id. MOVE_TO requires move_to (1-based position).",
      inputSchema: z.object({
        id: z.string().describe("Image id"),
        action: OrderableActionSchema,
        move_to: z.number().int().optional().describe("Target position for MOVE_TO"),
      }),
    },
    async ({ id, action, move_to }) =>
      runTool(async () => {
        const data = await gql.mutate(ReorderImageDocument, {
          input: { id, action, move_to },
        });
        return unwrap(data.reorder_image, "reorder_image").image;
      }),
  );
}
