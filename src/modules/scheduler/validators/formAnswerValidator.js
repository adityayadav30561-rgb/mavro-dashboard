// ===================================
// Intake form answer validator
// ===================================
// Server-authoritative. Frontend validation is UX only — every booking POST
// re-runs this against the canonical FormQuestion list.
//
// Input:
//   - questions: [FormQuestion]  (sorted by sortOrder)
//   - answers:   [{questionId, value}]  (client payload)
//
// Output:
//   - { ok: true, normalized: [...] }      — answers shaped for Booking.formAnswers
//   - { ok: false, error: '...' }          — first validation failure
//
// Each normalized entry includes labelSnapshot + typeSnapshot so the booking
// row is self-describing even after the FormQuestion is later edited / deleted.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/;
const PHONE_RE = /^[+0-9()\-\s.]{5,40}$/;

function isEmpty(v) {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function applyRules(value, rules) {
  if (!rules || typeof rules !== 'object') return null;
  if (typeof value === 'string') {
    if (rules.minLength != null && value.length < rules.minLength) {
      return `minimum length ${rules.minLength}`;
    }
    if (rules.maxLength != null && value.length > rules.maxLength) {
      return `maximum length ${rules.maxLength}`;
    }
    if (rules.pattern) {
      try {
        if (!new RegExp(rules.pattern).test(value)) return 'does not match required format';
      } catch {
        return 'invalid pattern rule on this question';
      }
    }
  }
  if (typeof value === 'number') {
    if (rules.min != null && value < rules.min) return `minimum ${rules.min}`;
    if (rules.max != null && value > rules.max) return `maximum ${rules.max}`;
  }
  return null;
}

function validateValueForType(type, value, options = []) {
  switch (type) {
    case 'short_text':
    case 'long_text':
      if (typeof value !== 'string') return 'must be a string';
      return null;
    case 'email':
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) return 'invalid email';
      return null;
    case 'phone':
      if (typeof value !== 'string' || !PHONE_RE.test(value)) return 'invalid phone';
      return null;
    case 'url':
      if (typeof value !== 'string' || !URL_RE.test(value)) return 'invalid url';
      return null;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) return 'must be a number';
      return null;
    case 'checkbox':
      if (typeof value !== 'boolean') return 'must be true or false';
      return null;
    case 'select':
      if (typeof value !== 'string') return 'must be a string';
      if (options.length && !options.includes(value)) return 'option not allowed';
      return null;
    case 'multi_select':
      if (!Array.isArray(value)) return 'must be an array';
      for (const v of value) {
        if (typeof v !== 'string') return 'must be array of strings';
        if (options.length && !options.includes(v)) return `option not allowed: ${v}`;
      }
      return null;
    default:
      return null;
  }
}

function validateFormAnswers({ questions, answers }) {
  const incoming = new Map();
  if (Array.isArray(answers)) {
    for (const a of answers) {
      if (a && a.questionId != null) incoming.set(String(a.questionId), a.value);
    }
  }
  const normalized = [];
  for (const q of questions || []) {
    const id = String(q._id);
    const present = incoming.has(id);
    const value = incoming.get(id);

    if (q.isRequired && (!present || isEmpty(value))) {
      return { ok: false, error: `"${q.label}" is required` };
    }
    if (present && !isEmpty(value)) {
      const typeErr = validateValueForType(q.type, value, q.options || []);
      if (typeErr) return { ok: false, error: `"${q.label}": ${typeErr}` };
      const ruleErr = applyRules(value, q.validationRules);
      if (ruleErr) return { ok: false, error: `"${q.label}": ${ruleErr}` };
    }
    if (present) {
      normalized.push({
        questionId: q._id,
        labelSnapshot: q.label,
        typeSnapshot: q.type,
        value: isEmpty(value) ? null : value,
      });
    }
  }
  return { ok: true, normalized };
}

module.exports = { validateFormAnswers };
