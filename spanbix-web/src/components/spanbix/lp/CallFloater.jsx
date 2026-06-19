'use client';

// Floating click-to-call button — fixed bottom-right, stacked ABOVE the
// WhatsApp floater. Tap → opens the dialer (tel:) with the office number and
// fires a `call_click` event for GA4 / Google Ads attribution.
//
// Number is the same office line used by WhatsApp + the contact page. Hardcoded
// here on purpose (mirrors WhatsAppFloater); a future contact-config module can
// replace both constants at once.

import { Phone } from 'lucide-react';
import { trackCall } from '@/lib/track';

const PHONE_TEL = '+919310793790';

export default function CallFloater() {
  return (
    <a
      href={`tel:${PHONE_TEL}`}
      aria-label="Call Spanbix now"
      title="Call us now"
      onClick={() => trackCall('floater')}
      style={{
        position: 'fixed',
        // Sits one button-height + gap above the WhatsApp floater (which is at
        // bottom: clamp(18px,3.5vw,28px), height: clamp(54px,7vw,64px)).
        bottom: 'calc(clamp(18px, 3.5vw, 28px) + clamp(54px, 7vw, 64px) + 14px)',
        right: 'clamp(18px, 3.5vw, 28px)',
        zIndex: 60,
        width: 'clamp(54px, 7vw, 64px)',
        height: 'clamp(54px, 7vw, 64px)',
        borderRadius: 999,
        background: 'var(--sx-navy)',
        color: 'var(--sx-citron)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 36px -6px rgba(16, 44, 86, 0.55), 0 4px 12px rgba(0,0,0,0.18)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Phone size={24} fill="currentColor" strokeWidth={0} />
    </a>
  );
}
