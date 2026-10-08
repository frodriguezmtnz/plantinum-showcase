import { prisma } from '@/lib/prisma';
import type { AiVerdictLabel } from '@/generated/prisma/enums';

export interface ImageVerdictView {
  label: AiVerdictLabel;
  category: string | null;
  confidence: number | null;
  summary: string | null;
  model: string;
  updatedAt: string;
}

function toView(verdict: {
  label: AiVerdictLabel;
  category: string | null;
  confidence: number | null;
  summary: string | null;
  model: string;
  updatedAt: Date;
}): ImageVerdictView {
  return {
    label: verdict.label,
    category: verdict.category,
    confidence: verdict.confidence,
    summary: verdict.summary,
    model: verdict.model,
    updatedAt: verdict.updatedAt.toISOString(),
  };
}

/** Latest cached AI verdict for one image hash, if any. */
export async function getCachedVerdict(
  hash: string,
): Promise<ImageVerdictView | null> {
  const verdict = await prisma.imageVerdict.findUnique({ where: { hash } });
  return verdict ? toView(verdict) : null;
}

/** Cached verdicts for a set of hashes, keyed by hash. */
export async function getCachedVerdicts(
  hashes: string[],
): Promise<Record<string, ImageVerdictView>> {
  const unique = [...new Set(hashes)].filter(Boolean);
  if (unique.length === 0) return {};
  const verdicts = await prisma.imageVerdict.findMany({
    where: { hash: { in: unique } },
  });
  return Object.fromEntries(verdicts.map((verdict) => [verdict.hash, toView(verdict)]));
}

export interface SaveImageVerdictInput {
  hash: string;
  label: AiVerdictLabel;
  category: string | null;
  confidence: number | null;
  summary: string | null;
  provider: string;
  model: string;
}

export async function saveImageVerdict(
  input: SaveImageVerdictInput,
): Promise<void> {
  await prisma.imageVerdict.upsert({
    where: { hash: input.hash },
    create: input,
    update: input,
  });
}
