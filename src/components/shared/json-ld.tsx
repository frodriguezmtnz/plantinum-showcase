import { serializeJsonLd, type JsonLdData } from '@/lib/json-ld';

export type { JsonLdData } from '@/lib/json-ld';

/** Renders schema.org structured data with `<` escaped. */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
