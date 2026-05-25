// ===================================
// routingRuleEvaluator — pure rule engine
// ===================================
// Stateless. Caller passes the form + invitee answers; evaluator walks the
// rules array in order and returns the first matching `target`, or `fallback`.
//
// SAFETY:
//   - All comparisons coerce defensively. Strings compared lowercased; numbers
//     parsed via `Number()`; arrays handled per-op.
//   - No eval / no dynamic JS. Op names are whitelisted via `OPS`.
//   - Bad rules throw `RoutingRuleError` so admins see config errors instead
//     of silently routing to fallback.
//
// EXAMPLE:
//   form.questions = [{ key: 'company_size', type: 'number' }, { key: 'use', type: 'select' }]
//   form.rules = [
//     { conditions: [{questionKey:'company_size', op:'greater_than', value:500}],
//       target: {type:'event_type', eventTypeSlug:'enterprise-demo'} },
//     { conditions: [{questionKey:'use', op:'equals', value:'support'}],
//       target: {type:'event_type', eventTypeSlug:'support-call'} },
//   ]
//   form.fallback = { type: 'event_type', eventTypeSlug: 'generic-call' }

class RoutingRuleError extends Error {
  constructor(message) { super(message); this.statusCode = 422; this.name = 'RoutingRuleError'; }
}

function normString(v) {
  return v == null ? '' : String(v).trim().toLowerCase();
}
function normNumber(v) {
  if (v == null || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

const OPS = {
  equals: (a, b) => normString(a) === normString(b),
  not_equals: (a, b) => normString(a) !== normString(b),
  contains: (a, b) => normString(a).includes(normString(b)),
  greater_than: (a, b) => {
    const na = normNumber(a), nb = normNumber(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return na > nb;
  },
  less_than: (a, b) => {
    const na = normNumber(a), nb = normNumber(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return na < nb;
  },
  includes_any: (a, b) => {
    const arr = asArray(a).map(normString);
    const candidates = asArray(b).map(normString);
    return arr.some((x) => candidates.includes(x));
  },
};

function evaluateCondition(cond, answers) {
  if (!cond || !cond.questionKey || !cond.op) throw new RoutingRuleError('Invalid condition shape');
  const fn = OPS[cond.op];
  if (!fn) throw new RoutingRuleError(`Unknown op: ${cond.op}`);
  return fn(answers[cond.questionKey], cond.value);
}

function evaluateRule(rule, answers) {
  if (!rule || !rule.conditions || !rule.target) return false;
  if (!rule.conditions.length) return false; // empty rules never match
  return rule.conditions.every((c) => evaluateCondition(c, answers));
}

function evaluateRouting(form, rawAnswers) {
  if (!form) throw new RoutingRuleError('Form not provided');
  const answers = rawAnswers && typeof rawAnswers === 'object' ? rawAnswers : {};
  // Required-question check
  for (const q of form.questions || []) {
    if (q.isRequired && (answers[q.key] == null || answers[q.key] === '')) {
      throw new RoutingRuleError(`Question "${q.label}" is required`);
    }
  }
  for (const rule of form.rules || []) {
    if (evaluateRule(rule, answers)) return { matched: rule, target: rule.target };
  }
  if (form.fallback) return { matched: null, target: form.fallback };
  return { matched: null, target: null };
}

module.exports = {
  evaluateRouting,
  evaluateRule,
  evaluateCondition,
  RoutingRuleError,
  OPS,
};
