/**
 * useStrength — two-state meter rewrite 2026-05-26.
 *
 * SUPERSEDES: prior zxcvbn-based hook (four-tier Weak/Fair/Good/Strong + zxcvbn score).
 * zxcvbn-ts removed entirely. Strength is now determined purely by rule evaluation.
 *
 * The model (2026-06-08):
 *   - 3 rules evaluated (length, numberOrSpecial, uppercase) — lowercase
 *     removed earlier; number+special collapsed into one OR rule; uppercase
 *     re-added as the third additive rule
 *   - rulesMet: count of met rules (0–3)
 *   - segmentsLit: floored at 1 once the password has any content, so typing
 *     the first character lights one red segment even before any rule is met:
 *       empty       → 0 of 3 lit (track only, label hidden)
 *       0 rules     → 1 of 3 lit (red progress, label "Weak")
 *       1 rule      → 1 of 3 lit (red progress, label "Weak")
 *       2 rules     → 2 of 3 lit (red progress, label "Weak")
 *       3 rules     → 3 of 3 lit (green, isStrong = true, label "Strong")
 *   - isStrong: rulesMet === 3 (all rules)
 *   - isValid:  same as isStrong (submission gate)
 *
 * Returns: {
 *   rulesMet:    number (0–3),
 *   ruleResults: { length, numberOrSpecial, uppercase } — booleans,
 *   segmentsLit: 0 | 1 | 2 | 3,
 *   isStrong:    boolean,
 *   isValid:     boolean,
 * }
 */

import { evaluateRules, allMandatoryMet } from '../components/rules.js';

const EMPTY_RULE_RESULTS = {
  length:          false,
  numberOrSpecial: false,
  uppercase:       false,
};

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

  // Floor at 1 once the password has content — typing the first character
  // lights one segment even before any rule is met. Empty input keeps the
  // bar at 0 (handled by the early return above).
  const segmentsLit = Math.max(1, rulesMet);

  return {
    rulesMet,
    ruleResults,
    segmentsLit,
    isStrong,
    isValid: isStrong,
  };
}
