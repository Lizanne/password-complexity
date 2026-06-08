/**
 * commonPasswords.js — constraint-gate constants + helpers (prototype scope).
 *
 * Two constraint gates layered on top of the additive 5-rule checklist:
 *   1. Common-password check  — case-sensitive list lookup (on blur)
 *   2. Consecutive-repeats    — regex over the live value (on keystroke)
 *
 * Display messages reuse the existing field-error slot. Constraint precedence
 * over additive validation messages is enforced in PasswordField.jsx.
 *
 * NEVER log the password value from any consumer of this module.
 */

// Prototype mock only — do not ship to production.
// Production will swap this for a server-side check against the filtered NCSC
// list (33,848 entries). Lookup is COMMON_PASSWORDS.includes(value) — case sensitive.
export const COMMON_PASSWORDS = [
  'Password1!',
  'Welcome1!',
  'Qwerty12!',
  'Letmein1!',
  'Iloveyou1!',
  'Football1!',
  'Sunshine1!',
  'Princess1!',
  'Superman1!',
  'Liverpool1!',
  'Chelsea12!',
  'Charlie12!',
  'Mustang1!',
  'Shadow12!',
  'Master12!',
  'Dragon12!',
  'Monkey12!',
  'Whatever1!',
  'Trustno1!',
  'Batman123!',
];

// Returns true if the password contains 3 or more consecutive identical characters.
// Examples: aaa → true, 111 → true, !!! → true, aab → false, aabbb → true.
export function hasConsecutiveRepeats(password) {
  return /(.)\1\1/.test(password);
}

// Returns true if the password is in the mock weak/common list. Case-sensitive
// lookup. Named isWeakOrCommon (rather than isCommon) so the call site reads
// as the player-facing concept — "weak or common password" — that the rejection
// message describes. Production swap target: server-side check.
export function isWeakOrCommon(password) {
  return COMMON_PASSWORDS.includes(password);
}

// Player-facing rejection messages for the two constraint gates.
// Rendered in the existing field-error slot — constraint message takes precedence
// over the additive submitMessage when both would otherwise appear.
export const REJECTION_MESSAGE_REPEATS =
  'Your password has too many repeats. Try varying the characters.';

export const REJECTION_MESSAGE_COMMON =
  'Your password is too easy to guess. Try something less common.';
