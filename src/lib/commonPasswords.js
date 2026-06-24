/**
 * commonPasswords.js — on-blur rejection gates (prototype scope).
 *
 * Two gates after the 2026-06-09 scope trim:
 *   - leading/trailing whitespace check (structural)
 *   - common-password lookup (case-sensitive, exact match)
 *
 * Both fire on blur. The consecutive-repeats check + repeats message and
 * the strength meter / "not accepted" state were removed from scope.
 *
 * Precedence in the field-error slot: whitespace > common > additive.
 *
 * NEVER log the password value from any consumer of this module.
 */

// ─── Prototype mock only — DO NOT SHIP TO PRODUCTION. ───────────────────────
// Production will replace this with a server-side check against the published
// CSV of common/breached credentials. The 20-entry mock here is intentionally
// curated so demo flows reliably hit the rejection path (each entry passes the
// additive rules, so the constraint gate is the only thing blocking it).
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

// Case-sensitive exact-match lookup. Production swap target.
export function isCommonPassword(password) {
  return COMMON_PASSWORDS.includes(password);
}

// Leading or trailing space — internal spaces (e.g. a passphrase like
// "correct horse battery staple") are allowed; only edge whitespace blocks.
export function hasLeadingOrTrailingSpace(password) {
  return (
    password.length > 0 &&
    (password[0] === ' ' || password[password.length - 1] === ' ')
  );
}

// Player-facing rejection messages — rendered in the existing field-error
// slot. Precedence (when both fire): whitespace > common > additive.
export const REJECTION_MESSAGE_COMMON =
  'Your password is too common, please try another';

export const REJECTION_MESSAGE_WHITESPACE =
  'Your password must not start or end with a space';
