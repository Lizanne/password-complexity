/**
 * useStrength — two-state meter rewrite 2026-05-26.
 *
 * SUPERSEDES: prior zxcvbn-based hook (four-tier Weak/Fair/Good/Strong + zxcvbn score).
 * zxcvbn-ts removed entirely. Strength is now determined purely by rule evaluation.
 *
 * The new model:
 *   - 3 rules evaluated (length, special, number) — uppercase + lowercase
 *     removed 2026-06-08 (no longer required; both still allowed in passwords)
 *   - rulesMet: count of met rules (0–3)
 *   - segmentsLit: identity mapping — one segment per rule met
 *       0 rules → 0 of 3 lit (track only)
 *       1 rule  → 1 of 3 lit (grey progress)
 *       2 rules → 2 of 3 lit (grey progress)
 *       3 rules → 3 of 3 lit (green, isStrong = true)
 *   - isStrong: rulesMet === 3 (all rules)
 *   - isValid: same as isStrong (submission gate)
 *
 * Returns: {
 *   rulesMet:    number (0–3),
 *   ruleResults: { length, number, special } — booleans,
 *   segmentsLit: 0 | 1 | 2 | 3,
 *   isStrong:    boolean,
 *   isValid:     boolean,
 * }
 *
 * Note: ruleResults keys use the rule ids from rules.js:
 *   length, number, special
 */

import { evaluateRules, allMandatoryMet } from '../components/rules.js';

const EMPTY_RULE_RESULTS = {
  length:  false,
  number:  false,
  special: false,
};

/**
 * Derive segmentsLit (0–3) from rulesMet (0–3) — identity mapping.
 * Rule count now equals segment count, so each met rule lights one segment.
 */
function segmentsFromRulesMet(rulesMet) {
  return rulesMet;
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
  const isStrong    = allMandatoryMet(ruleResults); // all 3 rules met

  return {
    rulesMet,
    ruleResults,
    segmentsLit: segmentsFromRulesMet(rulesMet),
    isStrong,
    isValid: isStrong,
  };
}
