import { describe, expect, it } from 'vitest';
import {
  moderationStatusForVerdict,
  parseTriageContent,
  parseTriageResponse,
  type TriageVerdict,
} from '@/lib/ai-verdict';

const meta = { provider: 'nan', model: 'NaN' };

function verdict(label: TriageVerdict['label']): TriageVerdict {
  return { label, category: null, confidence: 0.9, summary: null, ...meta };
}

describe('parseTriageContent', () => {
  it('parses a plain JSON reply', () => {
    const result = parseTriageContent(
      '{"label":"SAFE","category":"screenshot","confidence":0.93,"summary":"A trophy pop-up."}',
      'NaN',
    );
    expect(result).toMatchObject({
      label: 'SAFE',
      category: 'screenshot',
      confidence: 0.93,
      summary: 'A trophy pop-up.',
      model: 'NaN',
    });
  });

  it('strips markdown fences around the JSON', () => {
    const result = parseTriageContent(
      '```json\n{"label":"review","confidence":0.5}\n```',
      'NaN',
    );
    expect(result?.label).toBe('REVIEW');
    expect(result?.confidence).toBe(0.5);
  });

  it('accepts labelled verdicts from the model', () => {
    const result = parseTriageContent(
      '{"label":"nsfw","category":"sexual","confidence":0.99,"summary":"Explicit."}',
      'NaN',
    );
    expect(result?.label).toBe('UNSAFE');
    expect(result?.category).toBe('sexual');
  });

  it('scales a 0-100 confidence to 0-1', () => {
    const result = parseTriageContent('{"label":"SAFE","confidence":87}', 'NaN');
    expect(result?.confidence).toBeCloseTo(0.87);
  });

  it('rejects an unknown label or invalid JSON', () => {
    expect(parseTriageContent('{"label":"MAYBE"}', 'NaN')).toBeNull();
    expect(parseTriageContent('not json at all', 'NaN')).toBeNull();
  });
});

describe('parseTriageResponse', () => {
  it('reads the chat completion message content', () => {
    const result = parseTriageResponse(
      {
        choices: [
          { message: { content: '{"label":"REVIEW","summary":"Too blurry."}' } },
        ],
      },
      'NaN',
    );
    expect(result?.label).toBe('REVIEW');
    expect(result?.summary).toBe('Too blurry.');
  });

  it('returns null when the payload has no usable content', () => {
    expect(parseTriageResponse({ choices: [] }, 'NaN')).toBeNull();
    expect(parseTriageResponse({}, 'NaN')).toBeNull();
    expect(parseTriageResponse(null, 'NaN')).toBeNull();
  });
});

describe('moderationStatusForVerdict', () => {
  it('keeps safe plates published', () => {
    expect(moderationStatusForVerdict(verdict('SAFE'))).toBe('PUBLISHED');
  });

  it('sends review/unsafe verdicts to the moderator queue', () => {
    expect(moderationStatusForVerdict(verdict('REVIEW'))).toBe('UNDER_REVIEW');
    expect(moderationStatusForVerdict(verdict('UNSAFE'))).toBe('UNDER_REVIEW');
  });

  it('only auto-hides unsafe plates when the operator opts in', () => {
    expect(moderationStatusForVerdict(verdict('UNSAFE'), true)).toBe('HIDDEN');
    expect(moderationStatusForVerdict(verdict('REVIEW'), true)).toBe('UNDER_REVIEW');
  });
});
