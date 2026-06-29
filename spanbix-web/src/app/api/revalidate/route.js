import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// On-demand ISR revalidation. The Express backend POSTs here the moment a blog
// flips to `published` so the corresponding static page regenerates within
// seconds — no redeploy. Secret-gated: a request without the shared secret is
// rejected and revalidates nothing.
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const secret = process.env.REVALIDATE_SECRET;

  // Refuse to run unconfigured — an open revalidate endpoint is a DoS vector.
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, message: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { revalidated: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { slug, secret: provided } = body || {};

  if (!provided || provided !== secret) {
    return NextResponse.json(
      { revalidated: false, message: 'Invalid or missing secret' },
      { status: 401 }
    );
  }

  // Refresh the blog index on every publish; refresh the specific post too.
  revalidatePath('/blog');
  if (slug && typeof slug === 'string') {
    revalidatePath('/blog/' + slug);
  }

  // sitemap + robots are ISR-cached proxies of the backend (300s and 3600s
  // respectively). When the backend's canonical host or static-page set
  // changes, this endpoint is the only way to bust both caches on demand
  // without redeploying spanbix-web — repurposing the publish webhook keeps
  // dashboard editors from needing to know the difference.
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
  // revalidatePath re-renders the route but the proxied bodies live in the fetch
  // Data Cache — invalidate those entries by tag, or the regenerated routes just
  // re-serve the stale backend XML/text (this is why a new blog can render yet be
  // missing from the sitemap).
  revalidateTag('sitemap');
  revalidateTag('robots');

  return NextResponse.json({ revalidated: true, slug: slug || null, now: Date.now() });
}
