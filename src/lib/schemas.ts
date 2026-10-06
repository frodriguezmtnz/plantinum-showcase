import * as z from "zod";
import { ReportReason } from "@/generated/prisma/enums";
import {
  DEFAULT_WATERMARK_POSITION,
  WATERMARK_POSITIONS,
} from "@/lib/watermark-position";

/** Reasons a user can pick when flagging a plate. */
export const reportSchema = z.object({
  reason: z.nativeEnum(ReportReason, {
    errorMap: () => ({ message: "Pick a reason for the report." }),
  }),
  message: z
    .string()
    .trim()
    .max(500, { message: "Message is too long." })
    .optional(),
});

export type ReportValues = z.infer<typeof reportSchema>;

export const PLATINUM_PLATFORMS = ["PS3", "PS4", "PS5"] as const;

/** Corner the baked-in watermark sits in (upload-only, never persisted). */
export const watermarkPositionSchema = z
  .enum(WATERMARK_POSITIONS)
  .default(DEFAULT_WATERMARK_POSITION);

/**
 * Metadata that can be set when a platinum is uploaded or edited. The image
 * itself is content-addressed and immutable, so it lives outside this schema
 * on purpose: editing never re-processes or replaces the screenshot.
 */
export const platinumMetaSchema = z.object({
  gameName: z
    .string()
    .trim()
    .min(5, { message: "Game name must be at least 5 characters." })
    .max(120, { message: "Game name is too long." }),
  platform: z.enum(PLATINUM_PLATFORMS, {
    required_error: "You need to select a platform.",
  }),
  platinumDate: z.date({
    required_error: "A date for your platinum is required.",
  }),
  isSpoiler: z.boolean().default(false),
  comment: z
    .string()
    .trim()
    .max(500, { message: "Comment is too long." })
    .optional(),
});

export type PlatinumMetaValues = z.infer<typeof platinumMetaSchema>;

/** Server variant: the date arrives coerced from FormData or a Server Action. */
export const platinumMetaInputSchema = platinumMetaSchema.extend({
  platinumDate: z.coerce.date(),
});
