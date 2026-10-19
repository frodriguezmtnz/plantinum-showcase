export type JsonLdData = Record<string, unknown>;

/**
 * Renders schema.org structured data. `<` is escaped so user-provided text
 * (game names, usernames) can never close the script tag.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
