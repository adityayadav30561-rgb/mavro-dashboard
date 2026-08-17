'use client';

import Script from 'next/script';

// Meta (Facebook) Pixel loader for Meta Ads.
//
// Mounted once from the root layout, so it covers every page including
// /sap-course, which renders its own chrome rather than SpanbixLayout.
//
// Set the pixel id on the spanbix-web Vercel project (Production + Preview):
//   NEXT_PUBLIC_META_PIXEL_ID=1595579072051402
// When unset (local dev / not configured) this renders nothing, so localhost
// page views never pollute the ad account's data. Same contract as
// GoogleTagManager.jsx — do not hardcode the id here.
//
// CSP: connect.facebook.net is whitelisted in script-src and www.facebook.com
// in connect-src (next.config.mjs). Without those the browser blocks the
// script silently and no events ever reach Meta.
//
// autoConfig IS DISABLED ON PURPOSE — do not remove that line.
//
// fbevents.js ships its own button/form heuristics that invent standard events
// from what it thinks it sees. On /sap-course it logged a `Subscribe` on every
// click of "Enroll Now", including the clicks that were blocked by validation
// and saved nothing — five phantom Subscribes for one real enquiry. In Events
// Manager those show Setup method "Automatically logged", whereas our own
// events show "Manual setup".
//
// The Automatic events toggle in Events Manager does NOT stop this; that
// setting governs AI-suggested server-side additions. autoConfig lives in the
// pixel script and can only be turned off here, and it must be set BEFORE
// init.
//
// Consequence if re-enabled: the ad account fills with Subscribe events that
// do not correspond to leads, and anyone optimising a campaign against them
// would be optimising for button clicks.
//
// PageView fires here; the Lead conversion is sent from lib/track.js on the
// /sap-course form only.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixelScript() {
  if (!PIXEL_ID) return null;
  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${PIXEL_ID}');fbq('init','${PIXEL_ID}');fbq('track','PageView');`,
      }}
    />
  );
}

export function MetaPixelNoScript() {
  if (!PIXEL_ID) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
