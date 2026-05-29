import { trackCtaClick } from '@/lib/analytics';

// Floating WhatsApp action button — bottom-right, fixed.
// Opens wa.me/<phone>?text=<prefilled> in a new tab.

const PHONE = '919310793790';              // E.164 without '+', wa.me format
const PREFILL = 'I want to enquire about the courses';
const WA_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(PREFILL)}`;

export default function WhatsAppFab() {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Spanbix on WhatsApp"
      onClick={() => trackCtaClick('WhatsApp FAB', { location: 'floating-button' })}
      className="grid place-items-center"
      style={{
        position: 'fixed',
        right: 'clamp(16px, 3vw, 28px)',
        bottom: 'clamp(16px, 3vw, 28px)',
        width: 'clamp(54px, 7vw, 64px)',
        height: 'clamp(54px, 7vw, 64px)',
        borderRadius: 999,
        background: '#25D366',
        color: '#fff',
        boxShadow:
          '0 14px 28px -10px rgba(37, 211, 102, 0.55), 0 6px 14px -8px rgba(0, 0, 0, 0.35), 0 0 0 4px rgba(37, 211, 102, 0.18)',
        zIndex: 60,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
    >
      <svg
        viewBox="0 0 32 32"
        width="58%"
        height="58%"
        fill="currentColor"
        aria-hidden
      >
        <path d="M19.11 17.49c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.15-1.32-.79-.7-1.33-1.57-1.49-1.84-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.46-.83-2-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.26 0 1.34.98 2.63 1.11 2.81.14.18 1.93 2.95 4.67 4.13.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.02 5.33c-5.91 0-10.71 4.8-10.71 10.71 0 1.89.5 3.74 1.44 5.37l-1.53 5.59 5.73-1.5a10.66 10.66 0 0 0 5.07 1.29h.01c5.91 0 10.71-4.8 10.71-10.71 0-2.86-1.11-5.55-3.14-7.57a10.62 10.62 0 0 0-7.58-3.18zm0 19.5h-.01a8.9 8.9 0 0 1-4.53-1.24l-.32-.19-3.39.89.91-3.31-.21-.34a8.86 8.86 0 0 1-1.36-4.72c0-4.91 4-8.91 8.92-8.91 2.38 0 4.62.93 6.3 2.61a8.85 8.85 0 0 1 2.61 6.31c-.01 4.92-4.01 8.91-8.92 8.91z" />
      </svg>
    </a>
  );
}
