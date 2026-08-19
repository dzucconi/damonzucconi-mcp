import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  AddExhibitionEntityDocument,
  CreateExhibitionDocument,
  GetExhibitionDocument,
  ListExhibitionsDocument,
  RemoveExhibitionEntityDocument,
  UpdateExhibitionDocument,
  UpdateExhibitionEntityDocument,
} from "../generated/graphql";
import { GraphQLClient, runTool, unwrap } from "../graphql";
import {
  EntityTypeSchema,
  exhibitionCreateAttributes,
  exhibitionUpdateAttributes,
  imageCreate,
  imageUpdate,
  StateSchema,
} from "../schema";

export function registerExhibitionTools(server: McpServer, gql: GraphQLClient): void {
  server.registerTool(
    "list_exhibitions",
    {
      title: "List exhibitions",
      description: "List exhibitions (unpaginated), newest start_date first. Filter by state.",
      inputSchema: z.object({
        state: z.array(StateSchema).optional().describe("Filter by states. Omit to return all."),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ state }) =>
      runTool(async () => {
        const data = await gql.query(ListExhibitionsDocument, { state });
        return data.exhibitions;
      }),
  );

  server.registerTool(
    "get_exhibition",
    {
      title: "Get exhibition",
      description: "Fetch one exhibition by id, including images.",
      inputSchema: z.object({
        id: z.string().describe("Exhibition id"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      runTool(async () => {
        const data = await gql.query(GetExhibitionDocument, { id });
        return data.exhibition;
      }),
  );

  server.registerTool(
    "create_exhibition",
    {
      title: "Create exhibition",
      description: "Create an exhibition. title, state, and kind (SOLO or GROUP) are required.",
      inputSchema: exhibitionCreateAttributes,
    },
    async (attributes) =>
      runTool(async () => {
        const data = await gql.mutate(CreateExhibitionDocument, { input: { attributes } });
        return unwrap(data.add_exhibition, "add_exhibition").exhibition;
      }),
  );

  server.registerTool(
    "update_exhibition",
    {
      title: "Update exhibition",
      description: "Update an exhibition by id. Only include fields you want to change.",
      inputSchema: z.object({
        id: z.string().describe("Exhibition id"),
        attributes: exhibitionUpdateAttributes,
      }),
    },
    async ({ id, attributes }) =>
      runTool(async () => {
        const data = await gql.mutate(UpdateExhibitionDocument, { input: { id, attributes } });
        return unwrap(data.update_exhibition, "update_exhibition").exhibition;
      }),
  );

  server.registerTool(
    "add_exhibition_entity",
    {
      title: "Add exhibition image",
      description: "Add an image to an exhibition. The URL must already be hosted.",
      inputSchema: z.object({
        id: z.string().describe("Exhibition id"),
        image: imageCreate,
      }),
    },
    async ({ id, image }) =>
      runTool(async () => {
        const data = await gql.mutate(AddExhibitionEntityDocument, {
          input: { id, entity: { image } },
        });
        return unwrap(data.add_exhibition_entity, "add_exhibition_entity").exhibition;
      }),
  );

  server.registerTool(
    "update_exhibition_entity",
    {
      title: "Update exhibition image",
      description: "Update an image on an exhibition.",
      inputSchema: z.object({
        id: z.string().describe("Exhibition id"),
        entity_id: z.string().describe("Image id"),
        image: imageUpdate,
      }),
    },
    async ({ id, entity_id, image }) =>
      runTool(async () => {
        const data = await gql.mutate(UpdateExhibitionEntityDocument, {
          input: { id, entity: { id: entity_id, image } },
        });
        return unwrap(data.update_exhibition_entity, "update_exhibition_entity").exhibition;
      }),
  );

  server.registerTool(
    "remove_exhibition_entity",
    {
      title: "Remove exhibition entity",
      description: "Remove a nested entity from an exhibition. Images use type IMAGE.",
      inputSchema: z.object({
        id: z.string().describe("Exhibition id"),
        entity_id: z.string().describe("Nested entity id"),
        type: EntityTypeSchema.default("IMAGE"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ id, entity_id, type }) =>
      runTool(async () => {
        const data = await gql.mutate(RemoveExhibitionEntityDocument, {
          input: { id, entity: { id: entity_id, type } },
        });
        return unwrap(data.remove_exhibition_entity, "remove_exhibition_entity").exhibition;
      }),
  );
}
