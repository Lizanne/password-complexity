/**
 * useStrength → computeStrength (legacy name retained for call-site stability)
 *
 * Final-scope rewrite 2026-06-09. The strength METER is gone — no segments,
 * no Weak/Strong label, no progress visual. The checklist (driven by
 * ruleResults) is the only typing-state indicator now.
 *
 * What's left:
 *   - ruleResults: per-rule booleans for the checklist
 *   - rulesMet:    count of met rules (0–4)
 *   - isStrong:    all 4 rules met (still used to gate submission)
 *   - isValid:     alias of isStrong; reported to App.jsx via onChange
 *
 * No `segmentsLit`, no `categoriesMet`, no constraint-aware isValid (the
 * common-password gate is enforced separately at blur / submit time).
 */

import { evaluateRules, allMandatoryMet } from '../components/rules.js';

const EMPTY_RULE_RESULTS = {
  length:  false,
  special: false,
  number:  false,
  letter:  false,
};

export function computeStrength(password) {
  if (!password || password.length === 0) {
    return {
      rulesMet:    0,
      ruleResults: { ...EMPTY_RULE_RESULTS },
      isStrong:    false,
      isValid:     false,
    };
  }

  const ruleResults = evaluateRules(password);
  const rulesMet    = Object.values(ruleResults).filter(Boolean).length;
  const isStrong    = allMandatoryMet(ruleResults);

  return {
    rulesMet,
    ruleResults,
    isStrong,
    isValid: isStrong,
  };
}
