/**
 * Password rules — final-scope rewrite 2026-06-09.
 *
 * Four additive rules, all mandatory. Order is load-bearing — the checklist
 * renders RULES.map(...) in order, and findFirstMissingRule() iterates this
 * array.
 *
 * Earlier drafts went through several rule sets (uppercase, lowercase,
 * numberOrSpecial, consecutive-repeats constraint, ...). The final agreed
 * scope is: length, special, number, letter. Uppercase + lowercase do not
 * exist as separate checks anymore — "A letter" matches any A–Z (case
 * insensitive). The no-repeats constraint is fully out of scope.
 */

/**
 * 8+ characters.
 */
export function hasMinLength(password) {
  return password.length >= 8;
}

/**
 * One special character. Allowlist regex — whitespace and control chars
 * do NOT count as special, so a leading space alone doesn't satisfy.
 */
export function hasSpecial(password) {
  return /[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|~`£€¥]/.test(password);
}

/**
 * One digit 0–9.
 */
export function hasNumber(password) {
  return /[0-9]/.test(password);
}

/**
 * One letter — case-insensitive A–Z. Replaces the previous separate
 * uppercase + lowercase checks.
 */
export function hasLetter(password) {
  return /[A-Za-z]/.test(password);
}

export const RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    mandatory: true,
    check: hasMinLength,
  },
  {
    id: 'special',
    label: 'A special character (like ! @ £)',
    mandatory: true,
    check: hasSpecial,
  },
  {
    id: 'number',
    label: 'A number',
    mandatory: true,
    check: hasNumber,
  },
  {
    id: 'letter',
    label: 'A letter',
    mandatory: true,
    check: hasLetter,
  },
];

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

/**
 * Hint messages — keyed by rule id. Shown when Next is tapped with one rule
 * missing. Order of first-missing-rule lookup matches RULES array order above.
 */
export const HINT_MESSAGES = {
  length:  'Make it at least 8 characters to continue.',
  special: 'Add a special character to continue.',
  number:  'Add a number to continue.',
  letter:  'Add a letter to continue.',
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
 */
export function allMandatoryMet(ruleResults) {
  return RULES.every((r) => ruleResults[r.id]);
}

/**
 * Returns the id of the first unmet rule, or null if all rules are met.
 * The RULES array order determines which rule is "first" — load-bearing.
 */
export function findFirstMissingRule(password) {
  for (const rule of RULES) {
    if (!rule.check(password)) return rule.id;
  }
  return null;
}
