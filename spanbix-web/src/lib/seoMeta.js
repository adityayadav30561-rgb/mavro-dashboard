// Maps a useSEO-style descriptor into a Next.js Metadata object.
// Mirrors every tag the old client-side useSEO() hook emitted — title,
// description, keywords, canonical, Open Graph, Twitter card — but now resolved
// by Next so it ships in the server-rendered <head>. JSON-LD is handled
// separately by <JsonLd> (rendered in the page body), not here.
export function buildMetadata({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
}) {
  return {
    title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Spanbix',
      type: ogType,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
