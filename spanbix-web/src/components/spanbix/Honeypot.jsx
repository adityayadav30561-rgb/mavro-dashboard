'use client';

// Honeypot anti-spam field. Visually hidden + off-screen + not tab-reachable +
// autocomplete off, so a human never sees or fills it — but many bots blindly
// fill every input. If it comes back non-empty, the form treats the submission
// as a bot and skips the POST (see each form's onSubmit).
//
// Paid traffic attracts bots; this keeps junk leads out of the pipeline (and
// out of your cost-per-lead math) with zero friction for real users.
export default function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Company website
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={onChange}
        />
      </label>
    </div>
  );
}
