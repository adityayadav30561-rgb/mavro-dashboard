// Scope disclaimer shown under every Spanbix enquiry form.
//
// WHY THIS EXISTS: Google Ads flagged the account and asked for financial
// services certification, because "SAP FICO", "placement" and "counselling"
// copy can read like recruitment or financial advisory to a policy reviewer.
// This states plainly what Spanbix does and does not sell, on the page the
// reviewer lands on.
//
// TREAT THE TEXT AS LEGAL COPY. It was supplied by the business and must not
// be paraphrased, shortened, or "improved" — the exact wording is the point,
// including the registered entity name. Change it only on instruction.
//
// Rendered visibly, not as fine print: a disclaimer a reviewer cannot read is
// a disclaimer that does not count. Kept small but with real contrast, and it
// stays in the DOM on first paint (no interaction needed to reveal it).
export const ENQUIRY_DISCLAIMER =
  'This enquiry form is for paid SAP training/course counselling only. '
  + 'Spanbix Technologies Private Limited does not provide direct job hiring, '
  + 'recruitment services, loans, investments, insurance, trading, or '
  + 'financial advisory services.';

export default function EnquiryDisclaimer({ dark = false, align = 'left' }) {
  return (
    <p
      style={{
        fontSize: 11.5,
        lineHeight: 1.5,
        textAlign: align,
        color: dark ? 'rgba(255,255,255,0.72)' : 'var(--sx-ink-3)',
        borderTop: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid var(--sx-hairline)',
        paddingTop: 10,
        marginTop: 2,
      }}
    >
      {ENQUIRY_DISCLAIMER}
    </p>
  );
}
