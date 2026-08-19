import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  AddArtworkEntityDocument,
  CreateArtworkDocument,
  DeleteArtworkDocument,
  GetArtworkDocument,
  ListArtworksDocument,
  RemoveArtworkEntityDocument,
  ReorderArtworkDocument,
  UpdateArtworkDocument,
  UpdateArtworkEntityDocument,
} from "../generated/graphql";
import { GraphQLClient, runTool, unwrap } from "../graphql";
import {
  artworkCreateAttributes,
  artworkUpdateAttributes,
  attachmentCreate,
  attachmentUpdate,
  editionCreate,
  editionUpdate,
  embedCreate,
  embedUpdate,
  EntityTypeSchema,
  imageCreate,
  imageUpdate,
  linkCreate,
  linkUpdate,
  OrderableActionSchema,
  productionFileCreate,
  productionFileUpdate,
  StateSchema,
} from "../schema";

const ENTITY_KEYS = ["image", "link", "embed", "attachment", "edition", "production_file"] as const;

function exactlyOneEntity<T extends Record<string, unknown>>(value: T): void {
  const provided = ENTITY_KEYS.filter((key) => value[key] !== undefined);
  if (provided.length !== 1) {
    throw new Error(`Provide exactly one of: ${ENTITY_KEYS.join(", ")}`);
  }
}

export function registerArtworkTools(server: McpServer, gql: GraphQLClient): void {
  server.registerTool(
    "list_artworks",
    {
      title: "List artworks",
      description:
        "List artworks (unpaginated). Returns compact fields: id, slug, title, state, year, position. Filter by state and/or a case-insensitive title substring.",
      inputSchema: z.object({
        state: z.array(StateSchema).optional().describe("Filter by states. Omit to return all."),
        query: z.string().optional().describe("Case-insensitive title search"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ state, query }) =>
      runTool(async () => {
        const data = await gql.query(ListArtworksDocument, { state, query });
        return data.artworks;
      }),
  );

  server.registerTool(
    "get_artwork",
    {
      title: "Get artwork",
      description:
        "Fetch one artwork by id, including images, links, embeds, attachments, editions, and production files (with entity ids for later updates).",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      runTool(async () => {
        const data = await gql.query(GetArtworkDocument, { id });
        return data.artwork;
      }),
  );

  server.registerTool(
    "create_artwork",
    {
      title: "Create artwork",
      description: "Create an artwork. title, year, and state are required.",
      inputSchema: artworkCreateAttributes,
    },
    async (attributes) =>
      runTool(async () => {
        const data = await gql.mutate(CreateArtworkDocument, { input: { attributes } });
        return unwrap(data.add_artwork, "add_artwork").artwork;
      }),
  );

  server.registerTool(
    "update_artwork",
    {
      title: "Update artwork",
      description: "Update an artwork by id. Only include fields you want to change.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
        attributes: artworkUpdateAttributes,
      }),
    },
    async ({ id, attributes }) =>
      runTool(async () => {
        const data = await gql.mutate(UpdateArtworkDocument, { input: { id, attributes } });
        return unwrap(data.update_artwork, "update_artwork").artwork;
      }),
  );

  server.registerTool(
    "delete_artwork",
    {
      title: "Delete artwork",
      description: "Permanently delete an artwork by id.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      runTool(async () => {
        const data = await gql.mutate(DeleteArtworkDocument, { input: { id } });
        return data.delete_artwork;
      }),
  );

  server.registerTool(
    "reorder_artwork",
    {
      title: "Reorder artwork",
      description:
        "Move an artwork in the site order. Position is 1-based; higher position is closer to the top. MOVE_TO requires move_to.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
        action: OrderableActionSchema,
        move_to: z.number().int().optional().describe("Target position for MOVE_TO"),
      }),
    },
    async ({ id, action, move_to }) =>
      runTool(async () => {
        const data = await gql.mutate(ReorderArtworkDocument, {
          input: { id, action, moveTo: move_to },
        });
        return unwrap(data.reorder_artwork, "reorder_artwork").artwork;
      }),
  );

  server.registerTool(
    "add_artwork_entity",
    {
      title: "Add artwork entity",
      description:
        "Add exactly one nested entity to an artwork: image, link, embed, attachment, edition, or production_file. Image/attachment URLs must already be hosted.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
        image: imageCreate.optional(),
        link: linkCreate.optional(),
        embed: embedCreate.optional(),
        attachment: attachmentCreate.optional(),
        edition: editionCreate.optional(),
        production_file: productionFileCreate.optional(),
      }),
    },
    async (args) =>
      runTool(async () => {
        exactlyOneEntity(args);
        const { id, ...entity } = args;
        const data = await gql.mutate(AddArtworkEntityDocument, { input: { id, entity } });
        return unwrap(data.add_artwork_entity, "add_artwork_entity").artwork;
      }),
  );

  server.registerTool(
    "update_artwork_entity",
    {
      title: "Update artwork entity",
      description:
        "Update exactly one nested entity on an artwork. entity_id is the nested record id from get_artwork.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
        entity_id: z.string().describe("Nested entity id"),
        image: imageUpdate.optional(),
        link: linkUpdate.optional(),
        embed: embedUpdate.optional(),
        attachment: attachmentUpdate.optional(),
        edition: editionUpdate.optional(),
        production_file: productionFileUpdate.optional(),
      }),
    },
    async (args) =>
      runTool(async () => {
        exactlyOneEntity(args);
        const { id, entity_id, ...rest } = args;
        const data = await gql.mutate(UpdateArtworkEntityDocument, {
          input: { id, entity: { id: entity_id, ...rest } },
        });
        return unwrap(data.update_artwork_entity, "update_artwork_entity").artwork;
      }),
  );

  server.registerTool(
    "remove_artwork_entity",
    {
      title: "Remove artwork entity",
      description: "Remove a nested entity from an artwork.",
      inputSchema: z.object({
        id: z.string().describe("Artwork id"),
        entity_id: z.string().describe("Nested entity id"),
        type: EntityTypeSchema,
      }),
      annotations: { destructiveHint: true },
    },
    async ({ id, entity_id, type }) =>
      runTool(async () => {
        const data = await gql.mutate(RemoveArtworkEntityDocument, {
          input: { id, entity: { id: entity_id, type } },
        });
        return unwrap(data.remove_artwork_entity, "remove_artwork_entity").artwork;
      }),
  );
}
