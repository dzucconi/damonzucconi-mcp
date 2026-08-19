import { z } from "zod";
import type {
  ArtworkAttributes,
  AttachmentAttributes,
  Currency,
  EditionAttributes,
  EditionState,
  EmbedAttributes,
  EntityType,
  ExhibitionAttributes,
  ExhibitionKind,
  ImageAttributes,
  Kind,
  LinkAttributes,
  OrderableAction,
  ProductionFileAttributes,
  State,
  TagAttributes,
  UpdateArtworkAttributes,
  UpdateAttachmentAttributes,
  UpdateEditionAttributes,
  UpdateEmbedAttributes,
  UpdateExhibitionAttributes,
  UpdateImageAttributes,
  UpdateLinkAttributes,
  UpdateProductionFileAttributes,
  VisibilityEnum,
} from "./generated/graphql";

export const StateSchema = z
  .enum(["ARCHIVED", "DRAFT", "PUBLISHED", "SELECTED"] as const satisfies readonly State[])
  .describe("Content state");

export const VisibilitySchema = z
  .enum(["PUBLIC", "UNLISTED"] as const satisfies readonly VisibilityEnum[])
  .describe("Tag listing visibility");

export const ExhibitionKindSchema = z
  .enum(["GROUP", "SOLO"] as const satisfies readonly ExhibitionKind[])
  .describe("Exhibition kind");

export const OrderableActionSchema = z
  .enum([
    "MOVE_DOWN",
    "MOVE_TO",
    "MOVE_TO_BOTTOM",
    "MOVE_TO_TOP",
    "MOVE_UP",
  ] as const satisfies readonly OrderableAction[])
  .describe("Reorder action. MOVE_TO requires move_to.");

export const EntityTypeSchema = z
  .enum([
    "ATTACHMENT",
    "EDITION",
    "EMBED",
    "IMAGE",
    "LINK",
    "PRODUCTION_FILE",
  ] as const satisfies readonly EntityType[])
  .describe("Embedded entity type");

export const LinkKindSchema = z
  .enum(["CANONICAL", "DEFAULT", "SOURCE"] as const satisfies readonly Kind[])
  .describe("Link kind. CANONICAL is the primary URL for the work.");

export const EditionStateSchema = z
  .enum(["AVAILABLE", "NOT_FOR_SALE", "SOLD"] as const satisfies readonly EditionState[])
  .describe("Edition availability");

export const CurrencySchema = z
  .enum(["EUR", "USD"] as const satisfies readonly Currency[])
  .describe("Currency");

export const artworkCreateAttributes = z.object({
  title: z.string().describe("Title"),
  year: z.number().int().describe("Year"),
  state: StateSchema,
  description: z.string().optional().describe("Markdown description"),
  gloss: z.string().optional(),
  pitch: z.string().optional(),
  material: z.string().optional(),
  duration: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  unit: z.string().optional().describe("Dimension unit, e.g. in or cm"),
}) satisfies z.ZodType<ArtworkAttributes, ArtworkAttributes>;

export const artworkUpdateAttributes = z.object({
  title: z.string().optional(),
  year: z.number().int().optional(),
  state: StateSchema.optional(),
  description: z.string().optional(),
  gloss: z.string().optional(),
  pitch: z.string().optional(),
  material: z.string().optional(),
  duration: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  unit: z.string().optional(),
}) satisfies z.ZodType<UpdateArtworkAttributes, UpdateArtworkAttributes>;

export const exhibitionCreateAttributes = z.object({
  title: z.string(),
  state: StateSchema,
  kind: ExhibitionKindSchema,
  start_date: z.string().optional().describe("ISO date, YYYY-MM-DD"),
  end_date: z.string().optional().describe("ISO date, YYYY-MM-DD"),
  city: z.string().optional(),
  country: z.string().optional(),
  venue: z.string().optional(),
  external_url: z.string().optional(),
  description: z.string().optional().describe("Markdown description"),
}) satisfies z.ZodType<ExhibitionAttributes, ExhibitionAttributes>;

export const exhibitionUpdateAttributes = z.object({
  title: z.string().optional(),
  state: StateSchema.optional(),
  kind: ExhibitionKindSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  venue: z.string().optional(),
  external_url: z.string().optional(),
  description: z.string().optional(),
}) satisfies z.ZodType<UpdateExhibitionAttributes, UpdateExhibitionAttributes>;

export const tagCreateAttributes = z.object({
  title: z.string(),
  description: z.string().optional().describe("Markdown description"),
  state: StateSchema.optional(),
  visibility: VisibilitySchema.optional(),
  display_prices: z.boolean().optional(),
}) satisfies z.ZodType<TagAttributes, TagAttributes>;

export const tagUpdateAttributes = tagCreateAttributes;

export const imageCreate = z.object({
  url: z.string().describe("Image URL (already hosted, typically S3)"),
  title: z.string().optional(),
  description: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  largest_side_display_size: z.number().int().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<ImageAttributes, ImageAttributes>;

export const imageUpdate = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  largest_side_display_size: z.number().int().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<UpdateImageAttributes, UpdateImageAttributes>;

export const linkCreate = z.object({
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: LinkKindSchema.optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<LinkAttributes, LinkAttributes>;

export const linkUpdate = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: LinkKindSchema.optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<UpdateLinkAttributes, UpdateLinkAttributes>;

export const embedCreate = z.object({
  html: z.string().describe("Embed HTML"),
}) satisfies z.ZodType<EmbedAttributes, EmbedAttributes>;

export const embedUpdate = embedCreate satisfies z.ZodType<UpdateEmbedAttributes, UpdateEmbedAttributes>;

export const attachmentCreate = z.object({
  url: z.string(),
  title: z.string().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<AttachmentAttributes, AttachmentAttributes>;

export const attachmentUpdate = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<UpdateAttachmentAttributes, UpdateAttachmentAttributes>;

export const editionCreate = z.object({
  attributable: z.boolean().optional(),
  collector: z.string().optional(),
  inventory_number: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().int().optional(),
  price_currency: CurrencySchema.optional(),
  production_cost: z.number().int().optional(),
  production_cost_currency: CurrencySchema.optional(),
  sold_date: z.string().optional().describe("ISO date, YYYY-MM-DD"),
  sold_price: z.number().int().optional(),
  sold_price_currency: CurrencySchema.optional(),
  state: EditionStateSchema.optional(),
  display_price: z.number().int().optional(),
  display_price_currency: CurrencySchema.optional(),
}) satisfies z.ZodType<EditionAttributes, EditionAttributes>;

export const editionUpdate = editionCreate satisfies z.ZodType<UpdateEditionAttributes, UpdateEditionAttributes>;

export const productionFileCreate = z.object({
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  file_name: z.string().optional(),
  file_content_type: z.string().optional(),
  file_content_length: z.number().int().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<ProductionFileAttributes, ProductionFileAttributes>;

export const productionFileUpdate = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  file_name: z.string().optional(),
  file_content_type: z.string().optional(),
  file_content_length: z.number().int().optional(),
  state: StateSchema.optional(),
}) satisfies z.ZodType<UpdateProductionFileAttributes, UpdateProductionFileAttributes>;
