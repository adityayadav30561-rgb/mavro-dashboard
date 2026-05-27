// Server-rendered structured data. Emits one <script type="application/ld+json">
// per schema object so JSON-LD lands in the initial HTML — no client hook, no
// post-mount injection. Accepts a single object or an array of objects.
export default function JsonLd({ data }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
