/**
 * useStrength — two-state meter rewrite 2026-05-26.
 *
 * SUPERSEDES: prior zxcvbn-based hook (four-tier Weak/Fair/Good/Strong + zxcvbn score).
 * zxcvbn-ts removed entirely. Strength is now determined purely by rule evaluation.
 *
 * The new model:
 *   - 5 rules evaluated (length, upper, lower, number, special)
 *   - rulesMet: count of met rules (0–5)
 *   - segmentsLit: 3-segment bucket derived from rulesMet
 *       0 rules     → 0 of 3 lit (track only)
 *       1–2 rules   → 1 of 3 lit (grey progress)
 *       3–4 rules   → 2 of 3 lit (grey progress)
 *       5 rules     → 3 of 3 lit (green, isStrong = true)
 *   - isStrong: rulesMet === 5
 *   - isValid: same as isStrong (submission gate)
 *
 * Returns: {
 *   rulesMet:    number (0–5),
 *   ruleResults: { length, upper, lower, number, special } — booleans,
 *   segmentsLit: 0 | 1 | 2 | 3,
 *   isStrong:    boolean,
 *   isValid:     boolean,
 * }
 *
 * Note: ruleResults keys use the rule ids from rules.js:
 *   length, uppercase, lowercase, number, special
 */

import { evaluateRules, allMandatoryMet } from '../components/rules.js';

const EMPTY_RULE_RESULTS = {
  length:    false,
  uppercase: false,
  lowercase: false,
  number:    false,
  special:   false,
};

/**
 * Derive segmentsLit (0–3) from rulesMet (0–5).
 * Bucket table:
 *   0       → 0
 *   1–2     → 1
 *   3–4     → 2
 *   5 (all) → 3
 */
function segmentsFromRulesMet(rulesMet) {
  if (rulesMet === 0) return 0;
  if (rulesMet <= 2) return 1;
  if (rulesMet <= 4) return 2;
  return 3;
}

export function computeStrength(password) {
  if (!password || password.length === 0) {
    return {
      rulesMet:    0,
      ruleResults: { ...EMPTY_RULE_RESULTS },
      segmentsLit: 0,
      isStrong:    false,
      isValid:     false,
    };
  }

  const ruleResults = evaluateRules(password);
  const rulesMet    = Object.values(ruleResults).filter(Boolean).length;
  const isStrong    = allMandatoryMet(ruleResults); // all 5 rules met

  return {
    rulesMet,
    ruleResults,
    segmentsLit: segmentsFromRulesMet(rulesMet),
    isStrong,
    isValid: isStrong,
  };
}
