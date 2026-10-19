import type { ReportReason } from "@/generated/prisma/enums";

/** Reasons a visitor can pick when flagging a plate. */
export const USER_REPORT_REASONS = [
  'SEXUAL',
  'VIOLENT',
  'OFF_CONTEXT',
  'SPAM',
  'OTHER',
] as const satisfies readonly ReportReason[];

/** Every reason that can land in the moderator queue, owner appeals included. */
export const MODERATION_REPORT_REASONS = [
  ...USER_REPORT_REASONS,
  'APPEAL',
] as const satisfies readonly ReportReason[];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SEXUAL: 'Sexual content',
  VIOLENT: 'Violence or gore',
  OFF_CONTEXT: 'Not a platinum screenshot',
  SPAM: 'Spam or advertising',
  OTHER: 'Something else',
  APPEAL: 'Author appeal',
};
