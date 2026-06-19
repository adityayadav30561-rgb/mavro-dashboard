'use client';

import Script from 'next/script';

// Google Tag Manager loader. ONE container drives everything — GA4, Google Ads
// conversions, and any future tags are configured inside the GTM web UI, not in
// code. Our app only needs to (a) load this container and (b) push events to
// window.dataLayer (see lib/track.js). Nothing else here changes when you add or
// edit a destination tag.
//
// Set the container id on the spanbix-web Vercel project:
//   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
// When unset (local dev / not configured yet) this renders nothing — the site
// works normally and dataLayer pushes are simply not collected.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GtmScript() {
  if (!GTM_ID) return null;
  return (
    <Script
      id="gtm-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
}

export function GtmNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="gtm"
      />
    </noscript>
  );
}
