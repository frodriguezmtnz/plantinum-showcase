export type JsonLdData = Record<string, unknown>;

/**
 * Escapes `<` so user-provided text can never close the surrounding script
 * tag. Kept as a separate function so the guarantee is unit-tested.
 */
export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
