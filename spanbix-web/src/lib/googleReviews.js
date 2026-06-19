// Server-only — fetches real reviews from the Spanbix Google Business Profile
// via the Google Places Details API. Runs on the server (Node), so it is NOT
// subject to the browser CSP, and the API key never reaches the client.
//
// Setup (Phase C): enable "Places API" in Google Cloud, create an API key, find
// the Spanbix Place ID (https://developers.google.com/maps/documentation/places/web-service/place-id),
// then set two env vars on the spanbix-web Vercel project:
//   GOOGLE_PLACES_API_KEY=...
//   GOOGLE_PLACE_ID=...
//
// Without those vars this returns an empty set and the page simply shows the
// curated student reviews — no fabricated Google data, ever. The Places API
// returns up to 5 reviews per place (a Google limitation).

const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export async function getGoogleReviews() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return { reviews: [], rating: null, total: null };

  try {
    const url =
      `${PLACES_URL}?place_id=${encodeURIComponent(placeId)}` +
      `&fields=reviews,rating,user_ratings_total&reviews_sort=newest&key=${key}`;
    // Cache for a day — reviews don't change minute to minute.
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return { reviews: [], rating: null, total: null };
    const data = await res.json();
    const result = data?.result || {};
    const reviews = (result.reviews || [])
      .filter((r) => r?.text && r.text.trim().length > 0)
      .map((r) => ({
        name: r.author_name,
        text: r.text.trim(),
        rating: r.rating || 5,
        image: r.profile_photo_url || null,
        time: r.relative_time_description || null,
        source: 'google',
      }));
    return {
      reviews,
      rating: typeof result.rating === 'number' ? result.rating : null,
      total: typeof result.user_ratings_total === 'number' ? result.user_ratings_total : null,
    };
  } catch {
    return { reviews: [], rating: null, total: null };
  }
}
