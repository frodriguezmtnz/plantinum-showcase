import { describe, expect, it } from 'vitest';
import { ReportReason } from '@/generated/prisma/enums';
import {
  MODERATION_REPORT_REASONS,
  REPORT_REASON_LABELS,
  USER_REPORT_REASONS,
} from '@/lib/report-labels';

describe('report reasons', () => {
  it('never lets a visitor pick the appeal reason', () => {
    expect(USER_REPORT_REASONS).not.toContain('APPEAL');
  });

  it('keeps the appeal visible to moderators', () => {
    expect(MODERATION_REPORT_REASONS).toContain('APPEAL');
  });

  it('covers every enum value with a label', () => {
    for (const reason of Object.values(ReportReason)) {
      expect(REPORT_REASON_LABELS[reason]).toBeTruthy();
    }
  });
});
