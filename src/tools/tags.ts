import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  AddArtworkToTagDocument,
  CreateTagDocument,
  DeleteTagDocument,
  GetTagDocument,
  ListTagsDocument,
  RemoveArtworkFromTagDocument,
  UpdateTagDocument,
} from "../generated/graphql";
import { GraphQLClient, runTool, unwrap } from "../graphql";
import { StateSchema, tagCreateAttributes, tagUpdateAttributes, VisibilitySchema } from "../schema";

export function registerTagTools(server: McpServer, gql: GraphQLClient): void {
  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "List tags/sets. Filter by state and visibility (PUBLIC or UNLISTED).",
      inputSchema: z.object({
        state: z.array(StateSchema).optional(),
        visibility: VisibilitySchema.optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ state, visibility }) =>
      runTool(async () => {
        const data = await gql.query(ListTagsDocument, { state, visibility });
        return data.tags;
      }),
  );

  server.registerTool(
    "get_tag",
    {
      title: "Get tag",
      description: "Fetch one tag by id, including member artworks.",
      inputSchema: z.object({
        id: z.string().describe("Tag id"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      runTool(async () => {
        const data = await gql.query(GetTagDocument, { id });
        return data.tag;
      }),
  );

  server.registerTool(
    "create_tag",
    {
      title: "Create tag",
      description: "Create a tag/set of artworks. title is required.",
      inputSchema: tagCreateAttributes,
    },
    async (attributes) =>
      runTool(async () => {
        const data = await gql.mutate(CreateTagDocument, { input: { attributes } });
        return unwrap(data.add_tag, "add_tag").tag;
      }),
  );

  server.registerTool(
    "update_tag",
    {
      title: "Update tag",
      description:
        "Update a tag. The API requires title on every update even if it is unchanged; pass the current title when only changing other fields.",
      inputSchema: z.object({
        id: z.string().describe("Tag id"),
        attributes: tagUpdateAttributes,
      }),
    },
    async ({ id, attributes }) =>
      runTool(async () => {
        const data = await gql.mutate(UpdateTagDocument, { input: { id, attributes } });
        return unwrap(data.update_tag, "update_tag").tag;
      }),
  );

  server.registerTool(
    "delete_tag",
    {
      title: "Delete tag",
      description: "Delete a tag. Member artworks are not deleted.",
      inputSchema: z.object({
        id: z.string().describe("Tag id"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      runTool(async () => {
        const data = await gql.mutate(DeleteTagDocument, { input: { id } });
        return data.delete_tag;
      }),
  );

  server.registerTool(
    "add_artwork_to_tag",
    {
      title: "Add artwork to tag",
      description: "Add an artwork to a tag/set.",
      inputSchema: z.object({
        tag_id: z.string(),
        artwork_id: z.string(),
      }),
    },
    async ({ tag_id, artwork_id }) =>
      runTool(async () => {
        const data = await gql.mutate(AddArtworkToTagDocument, {
          input: { tagId: tag_id, artworkId: artwork_id },
        });
        return unwrap(data.add_artwork_to_tag, "add_artwork_to_tag").tag;
      }),
  );

  server.registerTool(
    "remove_artwork_from_tag",
    {
      title: "Remove artwork from tag",
      description: "Remove an artwork from a tag/set.",
      inputSchema: z.object({
        tag_id: z.string(),
        artwork_id: z.string(),
      }),
    },
    async ({ tag_id, artwork_id }) =>
      runTool(async () => {
        const data = await gql.mutate(RemoveArtworkFromTagDocument, {
          input: { tagId: tag_id, artworkId: artwork_id },
        });
        return unwrap(data.remove_artwork_from_tag, "remove_artwork_from_tag").tag;
      }),
  );
}
