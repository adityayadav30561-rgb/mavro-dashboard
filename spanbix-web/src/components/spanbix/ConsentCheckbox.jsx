'use client';

// Mandatory, explicit, affirmative consent control — required on every Spanbix
// lead form to satisfy the DPDP Act, 2023 (consent must be specific, informed,
// and unambiguous). Renders above the submit button. Native `required` blocks
// submission when unchecked; forms also validate it in JS before posting.
//
// On submit the form records `customFields.consent` so the admin Leads view
// shows proof of consent for each new submission.
export default function ConsentCheckbox({ checked, onChange, dark = false, error = false, inputRef }) {
  const linkColor = dark ? 'var(--sx-citron)' : 'var(--sx-navy)';
  const textColor = dark ? 'rgba(255,255,255,0.78)' : 'var(--sx-ink-2)';
  return (
    <label
      className="flex items-start gap-2.5"
      style={{
        cursor: 'pointer',
        // On a blocked submit the whole row gets a tinted, outlined panel. The
        // red text alone was easy to skim past — an ads consultant testing the
        // form missed it entirely and reported the pixel as broken.
        padding: error ? '8px 10px' : undefined,
        margin: error ? '-8px -10px' : undefined,
        borderRadius: error ? 8 : undefined,
        background: error ? 'rgba(244,63,94,0.07)' : undefined,
        border: error ? '1px solid rgba(244,63,94,0.45)' : undefined,
      }}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        required
        aria-invalid={error || undefined}
        style={{ marginTop: 3, width: 16, height: 16, accentColor: dark ? '#d4f04a' : '#102c56', flexShrink: 0 }}
      />
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: error ? '#dc2626' : textColor }}>
        <strong style={{ color: error ? '#dc2626' : (dark ? 'var(--sx-citron)' : 'var(--sx-navy)') }}>Required · </strong>
        I agree to Spanbix&apos;s{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline' }}>Privacy Policy</a>
        {' '}and{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'underline' }}>Terms</a>, and consent to being contacted about my career consultation.
      </span>
    </label>
  );
}

// Canonical value written to customFields.consent on a consented submission.
export const CONSENT_RECORD = 'Agreed — Privacy Policy & consent to be contacted';
