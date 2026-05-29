'use client';

// Floating WhatsApp button — fixed bottom-right on every Spanbix page.
//
// Tap → opens WhatsApp chat to the office number (+91 93107 93790) with the
// enquiry message prefilled. wa.me is the universal WhatsApp deep link; the
// `text` query string is the prefilled draft. Spec:
// https://faq.whatsapp.com/5913398998672934/?cms_platform=web
//
// The number must be the full international form WITHOUT the leading '+' and
// without spaces — wa.me ignores formatting characters but the canonical form
// is digits-only. Hardcoded here on purpose; a future move to a contact-config
// module can replace this constant.

const PHONE_DIGITS_ONLY = '919310793790';
const PREFILLED_MESSAGE = 'I want to enquire about the courses';

function WhatsAppGlyph({ size = 26 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.001 0h-.006C5.376 0 0 5.373 0 12c0 2.629.838 5.066 2.265 7.052L.79 23.452l4.555-1.456A11.95 11.95 0 0012.001 24C18.628 24 24 18.627 24 12s-5.372-12-11.999-12zm0 21.785c-2.124 0-4.109-.626-5.78-1.708l-4.04 1.292 1.314-3.916a9.685 9.685 0 01-1.895-5.768c0-5.385 4.401-9.785 9.792-9.785a9.79 9.79 0 019.788 9.785c0 5.39-4.4 9.785-9.788 9.785z" />
    </svg>
  );
}

export default function WhatsAppFloater() {
  const href = `https://wa.me/${PHONE_DIGITS_ONLY}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Spanbix on WhatsApp"
      title="Chat with us on WhatsApp"
      style={{
        position: 'fixed',
        bottom: 'clamp(18px, 3.5vw, 28px)',
        right: 'clamp(18px, 3.5vw, 28px)',
        zIndex: 60,
        width: 'clamp(54px, 7vw, 64px)',
        height: 'clamp(54px, 7vw, 64px)',
        borderRadius: 999,
        background: '#25D366',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 36px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0,0,0,0.18)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.boxShadow =
          '0 14px 40px -6px rgba(37, 211, 102, 0.65), 0 4px 14px rgba(0,0,0,0.22)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow =
          '0 12px 36px -6px rgba(37, 211, 102, 0.55), 0 4px 12px rgba(0,0,0,0.18)';
      }}
    >
      <WhatsAppGlyph />
    </a>
  );
}
