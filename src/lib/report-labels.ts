import type { ReportReason } from "@/generated/prisma/enums";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SEXUAL: 'Sexual content',
  VIOLENT: 'Violence or gore',
  OFF_CONTEXT: 'Not a platinum screenshot',
  SPAM: 'Spam or advertising',
  OTHER: 'Something else',
};
