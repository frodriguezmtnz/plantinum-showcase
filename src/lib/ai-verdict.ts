import type { AiVerdictLabel } from '@/generated/prisma/enums';

export const AI_TRIAGE_PROVIDER = 'nan';

export interface TriageVerdict {
  label: AiVerdictLabel;
  category: string | null;
  confidence: number | null;
  summary: string | null;
  provider: string;
  model: string;
}

/** Spellings a vision model may use for the three verdict buckets. */
const LABEL_ALIASES: Record<string, AiVerdictLabel> = {
  safe: 'SAFE',
  ok: 'SAFE',
  clean: 'SAFE',
  fine: 'SAFE',
  review: 'REVIEW',
  suspicious: 'REVIEW',
  uncertain: 'REVIEW',
  unclear: 'REVIEW',
  nsfw: 'UNSAFE',
  unsafe: 'UNSAFE',
  explicit: 'UNSAFE',
  violent: 'UNSAFE',
  hate: 'UNSAFE',
  spam: 'UNSAFE',
  scam: 'UNSAFE',
};

function normalizeLabel(value: unknown): AiVerdictLabel | null {
  if (typeof value !== 'string') return null;
  return LABEL_ALIASES[value.trim().toLowerCase()] ?? null;
}

function normalizeConfidence(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  const scaled = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0, scaled));
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Pulls the first JSON object out of a model reply, strips markdown fences. */
function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function parseTriageContent(
  content: string,
  model: string,
): TriageVerdict | null {
  const parsed = extractJsonObject(content);
  if (!parsed) return null;
  const label = normalizeLabel(parsed.label);
  if (!label) return null;
  return {
    label,
    category: readString(parsed.category),
    confidence: normalizeConfidence(parsed.confidence),
    summary: readString(parsed.summary),
    provider: AI_TRIAGE_PROVIDER,
    model,
  };
}

function readMessageContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: { content?: unknown } })?.message;
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) =>
        part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
          ? (part as { text: string }).text
          : '',
      )
      .join('')
      .trim();
    return text || null;
  }
  return null;
}

export function parseTriageResponse(
  payload: unknown,
  model: string,
): TriageVerdict | null {
  const content = readMessageContent(payload);
  return content ? parseTriageContent(content, model) : null;
}

/**
 * Maps a verdict to the plate's initial moderation state. UNSAFE only hides
 * automatically when the operator opts in; otherwise a moderator decides.
 */
export function moderationStatusForVerdict(
  verdict: { label: AiVerdictLabel },
  autoHideUnsafe = false,
): 'PUBLISHED' | 'UNDER_REVIEW' | 'HIDDEN' {
  if (verdict.label === 'SAFE') return 'PUBLISHED';
  if (verdict.label === 'UNSAFE' && autoHideUnsafe) return 'HIDDEN';
  return 'UNDER_REVIEW';
}

/**
 * Local testing helper: `NAN_FAKE_VERDICT=SAFE|REVIEW|UNSAFE` makes the whole
 * screening flow runnable without a real vision API.
 */
export function parseFakeVerdict(value: string | undefined): TriageVerdict | null {
  const raw = value?.trim().toUpperCase();
  if (raw === 'SAFE' || raw === 'REVIEW' || raw === 'UNSAFE') {
    return {
      label: raw,
      category: null,
      confidence: 1,
      summary: `Fake verdict for local testing (NAN_FAKE_VERDICT=${raw}).`,
      provider: 'fake',
      model: 'fake',
    };
  }
  return null;
}
