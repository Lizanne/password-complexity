/**
 * Password rules — PRD US-5 rewrite 2026-05-26.
 * Rule order + copy updated to Figma spec 2026-05-26.
 *
 * Five rules, ALL mandatory (no bonus rule).
 * Order is load-bearing: findFirstMissingRule() iterates this array and returns
 * the first unmet rule — the hint message shown to the user matches that rule's
 * position in the list. Do not reorder without updating HINT_MESSAGES below.
 *
 * Supersedes prior rule set: length=10, caseMix (combined), number, symbol-as-bonus.
 * Changes:
 *   - Length threshold: 10 → 8
 *   - caseMix split into two separate rules: uppercase + lowercase
 *   - Symbol rule promoted from bonus to mandatory (required, same circle icons)
 *   - BRIDGING_HINT / F7 / bonus framing are gone
 *   - Rule order updated: length → lowercase → special → uppercase → number (Figma 2026-05-26)
 *   - Rule copy updated to "One X" convention (Figma 2026-05-26)
 */

/**
 * OR rule (2026-06-08 collapse): passes if password has a digit OR a special
 * character — one of either is enough; the player doesn't need both. Special
 * characters are an explicit allowlist (not "anything non-alphanumeric") so
 * unintentional matches (whitespace, control chars) don't satisfy the rule.
 */
export function hasNumberOrSpecial(password) {
  return /[0-9]/.test(password) || /[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|~`£€¥]/.test(password);
}

/**
 * Uppercase additive rule — re-added 2026-06-08 as the third additive rule.
 * Lowercase stays removed (allowed in passwords but not required).
 */
export function hasUppercase(password) {
  return /[A-Z]/.test(password);
}

export const RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    mandatory: true,
    check: (password) => password.length >= 8,
  },
  {
    id: 'numberOrSpecial',
    label: 'One number or special character (like ! @ £)',
    mandatory: true,
    check: hasNumberOrSpecial,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    mandatory: true,
    check: hasUppercase,
  },
];

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

/**
 * Hint messages — verbatim from spec, keyed by rule id.
 * Shown when Next is tapped and the rule is the first unmet rule.
 * Order of first-missing-rule lookup matches RULES array order above.
 * Updated to "One X" convention (Figma 2026-05-26).
 */
export const HINT_MESSAGES = {
  length:          'Make it at least 8 characters to continue.',
  numberOrSpecial: 'Add a number or special character to continue.',
  uppercase:       'Add an uppercase letter to continue.',
};

/**
 * Empty-field hint — shown when Next is tapped with an empty field.
 */
export const EMPTY_HINT = 'Enter a password to continue.';

/**
 * Evaluate all rules for a given password.
 * Returns an object keyed by rule id with boolean values.
 */
export function evaluateRules(password) {
  const result = {};
  for (const rule of RULES) {
    result[rule.id] = rule.check(password);
  }
  return result;
}

/**
 * Returns true if all mandatory rules are satisfied.
 * (All rules are now mandatory — this is equivalent to allRulesMet.)
 */
export function allMandatoryMet(ruleResults) {
  return RULES.every((r) => ruleResults[r.id]);
}

/**
 * Returns the id of the first unmet rule, or null if all rules are met.
 * The RULES array order determines which rule is "first" — this is load-bearing.
 */
export function findFirstMissingRule(password) {
  for (const rule of RULES) {
    if (!rule.check(password)) return rule.id;
  }
  return null;
}
