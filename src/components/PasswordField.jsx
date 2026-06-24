/**
 * PasswordField.jsx — blur-driven error state + count-based submit message — 2026-05-26.
 *
 * What changed from on-blur blacklist slice:
 *
 *   BLUR-DRIVEN BORDER STATE MACHINE:
 *     - borderState: 'neutral' | 'error'
 *     - hasInteracted: boolean — true once user has blurred OR submitted with invalid input
 *     - On first focus: neutral, hasInteracted stays false
 *     - On first blur with invalid input: borderState='error', hasInteracted=true
 *     - On any keystroke where password becomes valid: borderState='neutral' immediately
 *     - On password becoming invalid again AFTER hasInteracted=true: borderState='error'
 *     - Error border (2px #B91C1C) takes precedence over focused blue (2px #378BDA)
 *     - fieldError prop and onFieldErrorDismiss prop REMOVED — message is now internal
 *
 *   COUNT-BASED SUBMIT MESSAGE (replaces single-string field-level error):
 *     - computeSubmitMessage(value, ruleResults) helper — 15 distinct strings
 *     - Silent while hasInteracted is false (user hasn't blurred or submitted yet)
 *     - Appears on first blur with invalid input; updates live as user types
 *     - Clears immediately when password becomes valid
 *     - CircleAlertIcon (16px) prefixed to message text with 4px gap
 *     - aria-live="polite" on the slot; aria-hidden="true" when no message
 *     - Message colour: var(--color-field-error) (#B91C1C) always when visible
 *       (brief: message text matches field error state; in practice always red while visible)
 *
 *   IMPERATIVE HANDLE ADDITIONS:
 *     - markInteracted(): sets hasInteracted=true (called by App.jsx on Next tap)
 *     - focus(): unchanged
 *     - setValue(value): unchanged
 *     - fireBlacklistCheck(value): unchanged (BLACKLIST_CHECK flag-gated)
 *
 *   REMOVED:
 *     - fieldError prop (was App.jsx-managed single-string hint)
 *     - onFieldErrorDismiss prop (was called on first keystroke to clear fieldError)
 *     - Field error slot (SLOT 3) old rendering replaced by submit message slot
 *
 * What is unchanged:
 *   - Rule set (3 additive rules: length, numberOrSpecial, uppercase — lowercase
 *     stays removed; number+special collapsed into one OR rule; uppercase re-added
 *     2026-06-08), MIN_LENGTH/MAX_LENGTH
 *   - Blacklist check (BLACKLIST_CHECK flag, on-blur trigger, cache, AbortController)
 *   - Rejection notice (SLOT 2) — still below checklist, flag-gated
 *   - externalError prop (server-side errors)
 *   - Live region copy, strength computation, checklist, meter
 *   - onBlacklistStatusChange callback to surface status to App.jsx
 *
 * Props:
 *   context: "registration" | "reset" | "settings"
 *   onChange: (value: string, isValid: boolean) => void
 *   onBlacklistStatusChange: (status: 'idle'|'checking'|'accepted'|'rejected'|'timeout') => void
 *   externalError: string | null  — server-side error message to display
 *   fireBlacklistCheck: () => void — imperative handle (BLACKLIST_CHECK only)
 */

import { useState, useEffect, useLayoutEffect, useRef, useId, useCallback, forwardRef, useImperativeHandle } from 'react';
import './PasswordField.css';
import { RULES, MIN_LENGTH, MAX_LENGTH } from './rules.js';
import { computeStrength } from '../hooks/useStrength.js';
import { checkPassword } from '../lib/passwordCheck.js';
import {
  isCommonPassword,
  hasLeadingOrTrailingSpace,
  REJECTION_MESSAGE_COMMON,
  REJECTION_MESSAGE_WHITESPACE,
} from '../lib/commonPasswords.js';
import { FEATURES } from '../config/features.js';

/* ─── Copy strings — final-scope rewrite 2026-06-09 ─── */
/*
 * REMOVED (superseded):
 *   LABEL_WEAK / LABEL_STRONG / not-accepted — strength meter is gone
 *   strengthChange / submitThreshold live region copy — no meter to announce
 *   rejectionNotice copy — old constraint-gate UX is gone
 */
const COPY = {
  label: {
    registration: 'Create a password',
    reset: 'New password',
    settings: 'New password',
  },
  helper: {
    registration: 'Your password keeps your account secure.',
    reset: 'Create a new password for your account.',
    settings: 'Update your account password.',
  },
  infoBox: 'Your new password works as soon as you save it.',
  toggle: {
    show: 'Show password',
    hide: 'Hide password',
  },
  liveRegion: {
    ruleMet: {
      length:  'Length met — 8 or more characters',
      special: 'Special character added',
      number:  'Number included',
      letter:  'Letter added',
    },
    ruleBroken: {
      length:  'Length no longer met — need 8 or more characters',
      special: 'Special character removed',
      number:  'Number no longer included',
      letter:  'Letter no longer included',
    },
  },
};

/* ─── Info icon SVG — used for reset info box only ─── */
function InfoIcon({ size = 14 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}


/* ─── Eye icon (password hidden — show action) ─── */
function EyeIcon({ size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

/* ─── Eye-slash icon (password visible — hide action) ─── */
function EyeSlashIcon({ size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.73 6.16C11.15 6.06 11.57 6 12 6C19 6 23 12 23 12C22.5 12.92 21.91 13.78 21.23 14.56M6.35 6.35C3.69 8.03 2 11 2 12C2 12 6 20 12 20C14.2 20 16.18 19.22 17.77 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14.83 14.83A3 3 0 1 1 9.17 9.17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Circle alert icon — used for submit message (brief 2026-05-26) ─── */
function CircleAlertIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 5.33334V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.31811 14.6667 1.33334 11.6819 1.33334 8C1.33334 4.31811 4.31811 1.33334 8 1.33334C11.6819 1.33334 14.6667 4.31811 14.6667 8Z"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Error icon ─── */
function AlertIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 4.5V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="white" />
    </svg>
  );
}

/* ─── Checklist icon: circle outline (unmet) — user-supplied SVG ─── */
function CircleOutlineIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.00016 14.6668C11.6821 14.6668 14.6668 11.6821 14.6668 8.00016C14.6668 4.31826 11.6821 1.3335 8.00016 1.3335C4.31826 1.3335 1.3335 4.31826 1.3335 8.00016C1.3335 11.6821 4.31826 14.6668 8.00016 14.6668Z"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Checklist icon: outlined circle + check (met) — user-supplied SVG ─── */
/* Split paths so the check stroke can draw in via stroke-dashoffset animation */
function CircleCheckIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="pf-check-circle"
        d="M14.6668 8.00016C14.6668 11.6821 11.6821 14.6668 8.00016 14.6668C4.31826 14.6668 1.3335 11.6821 1.3335 8.00016C1.3335 4.31826 4.31826 1.3335 8.00016 1.3335C11.6821 1.3335 14.6668 4.31826 14.6668 8.00016Z"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="pf-check-tick"
        d="M6.00016 8.00016L7.3335 9.3335L10.0002 6.66683"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*
 * PlusOutlineIcon and PlusFilledIcon are kept as dead code — no longer used since
 * symbol rule is now mandatory (circle icons). Safe to prune in a future cleanup pass.
 */

/*
 * Message family — final-scope rewrite 2026-06-09.
 * 6 strings: empty + 4 single + 1 generic. With one rule unmet we name it;
 * with two or more unmet we defer to the checklist below the field.
 * No pair strings — the simplification is intentional.
 */
const SUBMIT_MESSAGES = {
  empty: 'Enter a password',
  single: {
    length:  'Use at least 8 characters',
    special: 'Add a special character',
    number:  'Add a number',
    letter:  'Add a letter',
  },
  generic: 'Your password needs a few more things',
};

/* Ordered rule IDs — matches checklist display order. */
const RULE_ORDER = ['length', 'special', 'number', 'letter'];

function computeSubmitMessage(value, ruleResults) {
  if (!value || value.length === 0) return SUBMIT_MESSAGES.empty;
  const unmet = RULE_ORDER.filter((id) => !ruleResults[id]);
  if (unmet.length === 0) return null;
  if (unmet.length === 1) return SUBMIT_MESSAGES.single[unmet[0]];
  // 2+ unmet → generic, defer to checklist
  return SUBMIT_MESSAGES.generic;
}

/* ─── Main component ─── */
const PasswordField = forwardRef(function PasswordField({
  context = 'registration',
  onChange,
  onBlacklistStatusChange,
  externalError = null,
}, ref) {
  // Password is hidden by default (type="password" — dots). User toggles via the
  // eye button. No viewport/context auto-reveal — dots stay dots until toggled.
  const [password, setPassword] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);

  // ─── Blur-driven error state machine (brief 2026-05-26) ───
  // hasInteracted: true once the user has blurred the field OR tapped Next with invalid input.
  // borderState: 'neutral' | 'error' — drives the field underline colour.
  //   Transitions handled in handleBlur, handlePasswordChange, and markInteracted().
  const [hasInteracted, setHasInteracted] = useState(false);
  const [borderState, setBorderState] = useState('neutral');

  // Focus tracking for floating label state
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  // Rule-evaluation state — computed on debounce. Drives the checklist + the
  // additive message. No strength meter to feed; segmentsLit is gone.
  const [strengthResult, setStrengthResult] = useState({
    rulesMet:    0,
    ruleResults: { length: false, special: false, number: false, letter: false },
    isStrong:    false,
    isValid:     false,
  });

  // Track which rules were previously met for regression detection
  const [ruleWasMet, setRuleWasMet] = useState({
    length:  false,
    special: false,
    number:  false,
    letter:  false,
  });

  // Server-side external error state
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorDismissing, setErrorDismissing] = useState(false);

  // Blacklist check state — preserved behind FEATURES.BLACKLIST_CHECK (off).
  const [blacklistStatus, setBlacklistStatus] = useState('idle');

  // Live region string
  const [liveText, setLiveText] = useState('');

  // Blur-driven constraint state. Both set in handleBlur; cleared in
  // handlePasswordChange + setValue when the live value no longer matches.
  // Precedence in the field-error slot: whitespace > common > additive.
  const [commonActive, setCommonActive] = useState(false);
  const [whitespaceActive, setWhitespaceActive] = useState(false);

  const debounceRef = useRef(null);
  /* F5 — stagger refs for live region queue */
  const announceTimersRef = useRef([]);
  /* F8 — ref for scrollIntoView on external error */
  const errorRef = useRef(null);
  /* Field-error slot ref + multi-line state — drives the icon's vertical
     alignment. CSS can't detect line wrap, so we measure post-render and
     toggle a modifier class. */
  const fieldErrorRef = useRef(null);
  const [isFieldErrorMultiLine, setIsFieldErrorMultiLine] = useState(false);
  // ─── On-blur blacklist check refs ───
  // Real AbortController for in-flight checks. Aborted when user re-focuses + edits.
  const blacklistAbortRef = useRef(null);
  // Cache: { value → { accepted, reason } } per component instance.
  // Re-blurring an already-checked value never re-fires the call.
  const blacklistCacheRef = useRef(new Map());
  // Detects "re-focus + edit" (not re-focus alone). Set true on focus; cleared once
  // it triggers an abort in handlePasswordChange.
  const hasFocusedSinceLastCheckRef = useRef(false);
  // Ref to the actual <input> element — used by imperative handle below
  const inputElementRef = useRef(null);

  // IDs for accessible associations
  const uid = useId();
  const fieldId = `pf-field-${uid}`;
  const helperId = `pf-helper-${uid}`;
  const infoBoxId = `pf-info-${uid}`;
  const liveRegionId = `pf-live-${uid}`;
  const errorId = `pf-error-${uid}`;
  const submitMsgId = `pf-submit-msg-${uid}`;
  const rejectionNoticeId = `pf-rejection-${uid}`;

  // ─── Border state: sync when hasInteracted is set via imperative markInteracted() ───
  // When App.jsx calls markInteracted() on Next tap, hasInteracted flips to true.
  // We need to set borderState based on current password validity at that moment.
  // computeStrength is synchronous — safe to call outside debounce.
  // This effect also fires on the initial render (hasInteracted=false) — harmless
  // because the early-return guard prevents any state change at that point.
  useEffect(() => {
    if (!hasInteracted) return;
    const { isValid: currentlyValid } = computeStrength(password);
    if (currentlyValid) {
      setBorderState('neutral');
    } else {
      setBorderState('error');
    }
  // password intentionally omitted — this effect is only for the hasInteracted
  // transition. Per-keystroke border updates are handled in handlePasswordChange.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted]);

  // ─── Sync external error ───
  useEffect(() => {
    if (externalError) {
      setErrorMsg(externalError);
      setErrorDismissing(false);
    }
  }, [externalError]);

  // F8 — scroll external error into view
  useEffect(() => {
    if (!externalError || !errorRef.current) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    errorRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
      block: 'nearest',
    });
  }, [externalError]);

  // ─── Surface blacklist status to App.jsx ───
  useEffect(() => {
    if (onBlacklistStatusChange) onBlacklistStatusChange(blacklistStatus);
  }, [blacklistStatus, onBlacklistStatusChange]);

  // ─── On-blur blacklist check ───
  //
  // Fires when all of:
  //   1. Value is non-empty
  //   2. All 5 complexity rules are met (isValid from computeStrength)
  //   3. Value is not already in the cache (new value or cache miss)
  //
  // Uses a real AbortController. The controller is stored in blacklistAbortRef.
  // If the user re-focuses AND edits while a check is in flight, handlePasswordChange
  // aborts the controller. Re-focus alone does not abort.
  //
  // Returns void. State updates happen via setBlacklistStatus.
  // Exposed via useImperativeHandle for the "Next tapped before blur" path.
  const runBlacklistCheck = useCallback(async (value) => {
    // Guard: empty value — no call, no state change
    if (!value || value.length === 0) return;

    // Guard: complexity not met — no call
    const strengthAtBlur = computeStrength(value);
    if (!strengthAtBlur.isValid) return;

    // Cache lookup — same value already checked, result is fresh
    const cache = blacklistCacheRef.current;
    if (cache.has(value)) {
      const cached = cache.get(value);
      // Apply cached result without re-fetching
      if (cached.accepted) {
        setBlacklistStatus('accepted');
      } else {
        setBlacklistStatus('rejected');
      }
      return;
    }

    // Abort any previous in-flight check
    if (blacklistAbortRef.current) {
      blacklistAbortRef.current.abort();
    }

    const controller = new AbortController();
    blacklistAbortRef.current = controller;

    setBlacklistStatus('checking');

    try {
      const result = await checkPassword(value, { signal: controller.signal });
      // Store in cache before updating state
      cache.set(value, result);
      setBlacklistStatus(result.accepted ? 'accepted' : 'rejected');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User re-focused + edited while in flight — discard silently, no state change
        return;
      }
      // Timeout or unexpected error — treat as accepted, server is authoritative
      setBlacklistStatus('timeout');
    } finally {
      // Clear the ref if this controller is still the active one
      if (blacklistAbortRef.current === controller) {
        blacklistAbortRef.current = null;
      }
    }
  }, []);

  // ─── Debounced rule evaluation + per-rule announcements ─────────────────
  const scheduleStrengthUpdate = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = computeStrength(value);

      setStrengthResult((prev) => {
        setRuleWasMet((prevWas) => {
          const next = { ...prevWas };
          for (const key of Object.keys(next)) {
            if (prevWas[key] && !result.ruleResults[key]) {
              next[key] = false;
            } else {
              next[key] = result.ruleResults[key];
            }
          }
          return next;
        });

        // Staggered per-rule live-region announcements. No strength-change
        // announcement anymore (no meter to announce); no submit-threshold
        // announcement either — both retired with the meter.
        if (value.length > 0) {
          announceTimersRef.current.forEach(clearTimeout);
          announceTimersRef.current = [];

          const queue = [];
          if (prev.ruleResults) {
            let ruleOffset = 0;
            for (const rule of RULES) {
              const wasMetBefore = prev.ruleResults[rule.id];
              const isMetNow     = result.ruleResults[rule.id];
              if (!wasMetBefore && isMetNow) {
                queue.push({ msg: COPY.liveRegion.ruleMet[rule.id], delay: ruleOffset });
                ruleOffset += 50;
              } else if (wasMetBefore && !isMetNow) {
                queue.push({ msg: COPY.liveRegion.ruleBroken[rule.id], delay: ruleOffset });
                ruleOffset += 50;
              }
            }
          }

          queue.forEach(({ msg, delay }) => {
            if (delay === 0) {
              setLiveText(msg);
            } else {
              const t = setTimeout(() => setLiveText(msg), delay);
              announceTimersRef.current.push(t);
            }
          });
        }

        return result;
      });

      if (onChange) {
        // Reported isValid is the 4-rule check only. The on-blur constraint
        // gates (whitespace / common-password) are enforced separately at
        // submit time in App.jsx — they're not folded into this flag.
        onChange(value, result.isValid);
      }
    }, 300);
  }, [onChange]);

  // Expose setValue(value), focus(), markInteracted(), and fireBlacklistCheck() to parent via forwardRef.
  //
  // setValue: fills the field programmatically (e.g., demo chips).
  //   - Does NOT fire the blacklist check (no debounce path anymore — blur-only).
  //   - Does NOT abort any in-flight check.
  //   - If value clears, aborts any in-flight check and resets to idle.
  //
  // markInteracted: called by App.jsx when Next is tapped with invalid input.
  //   Sets hasInteracted=true so the submit message and error border appear.
  //   App.jsx calls this before focusInput() — the message is computed from current
  //   ruleResults on next render.
  //
  // fireBlacklistCheck: called by App when Next is tapped and the field hasn't blurred
  //   yet (user typed or chip-filled, focus still on the input). Equivalent to a blur
  //   trigger — runs through the same cache/complexity guards.
  //
  // focus: focuses the underlying <input>.
  useImperativeHandle(ref, () => ({
    setValue(value) {
      if (value.length > MAX_LENGTH) return;
      setPassword(value);
      if (!hasTyped && value.length > 0) setHasTyped(true);
      if (value.length === 0) {
        // Field cleared: abort any in-flight check, reset to idle
        if (blacklistAbortRef.current) {
          blacklistAbortRef.current.abort();
          blacklistAbortRef.current = null;
        }
        setBlacklistStatus('idle');
        // Reset interaction state when field is fully cleared
        setHasInteracted(false);
        setBorderState('neutral');
        setCommonActive(false);
        setWhitespaceActive(false);
      } else {
        // Programmatic fill: clear any stale constraint flags that no longer
        // apply to the new value. Parity with handlePasswordChange.
        if (commonActive && !isCommonPassword(value)) setCommonActive(false);
        if (whitespaceActive && !hasLeadingOrTrailingSpace(value)) setWhitespaceActive(false);
      }
      scheduleStrengthUpdate(value);
      // No blacklist call here — check fires on blur or on Next tap via fireBlacklistCheck
    },
    // markInteracted: called by App.jsx on Next tap with invalid input.
    // Triggers the blur-driven state machine from the submit path.
    markInteracted() {
      setHasInteracted(true);
    },
    // setConstraintFlags: called by App.jsx after the on-tap constraint check
    // when Next is pressed without a prior blur. Mirrors the state that
    // handleBlur would have set — surfaces the constraint message in the
    // field-error slot and turns the underline red via hasInputError.
    setConstraintFlags({ common, whitespace }) {
      setCommonActive(Boolean(common));
      setWhitespaceActive(Boolean(whitespace));
      setHasInteracted(true);
    },
    // When BLACKLIST_CHECK is on: runs the real check (same guards as blur handler).
    // When BLACKLIST_CHECK is off: returns accepted immediately — Path 6 in App.jsx
    //   calls this then waits for blacklistStatus to settle; App.jsx gates on the flag
    //   before ever reaching this path, so this stub is defence-in-depth only.
    fireBlacklistCheck: FEATURES.BLACKLIST_CHECK
      ? (value) => { runBlacklistCheck(value); }
      : () => Promise.resolve({ accepted: true, reason: null }),
    focus() {
      if (inputElementRef.current) inputElementRef.current.focus();
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [hasTyped, scheduleStrengthUpdate, runBlacklistCheck]);

  // ─── Password input handler ───
  function handlePasswordChange(e) {
    const value = e.target.value;
    if (value.length > MAX_LENGTH) return;
    setPassword(value);
    if (!hasTyped && value.length > 0) setHasTyped(true);

    // ─── "Re-focus + edit" abort ───
    // If the user re-focused the field (hasFocusedSinceLastCheckRef = true) and is
    // now editing, abort any in-flight check. Re-focus alone (no edit) does NOT abort.
    // Gated: when BLACKLIST_CHECK is off no check ever runs, so the abort ref is always
    // null. Still wrapped for clarity — makes flag-flip safe without code changes.
    if (FEATURES.BLACKLIST_CHECK) {
      if (hasFocusedSinceLastCheckRef.current && blacklistAbortRef.current) {
        blacklistAbortRef.current.abort();
        blacklistAbortRef.current = null;
      }
    }
    // Clear the flag now that we've handled the first edit after re-focus
    hasFocusedSinceLastCheckRef.current = false;

    // ─── Border state machine update on typing ───
    // computeStrength is synchronous; use it directly here for the border state.
    // (strengthResult state updates are debounced at 300ms — we need the border
    // to respond immediately to password validity changes.)
    if (hasInteracted) {
      const { isValid: currentlyValid } = computeStrength(value);
      if (currentlyValid) {
        setBorderState('neutral');
      } else if (value.length === 0) {
        // Field cleared after interaction — reset all interaction state
        setBorderState('neutral');
        setHasInteracted(false);
      } else {
        setBorderState('error');
      }
    }

    // Dismiss external server error on keystroke
    if (errorMsg && !errorDismissing) {
      setErrorDismissing(true);
      setTimeout(() => {
        setErrorMsg(null);
        setErrorDismissing(false);
      }, 150);
    }

    // Field cleared: abort any in-flight check, reset blacklist to idle
    if (value.length === 0) {
      if (blacklistAbortRef.current) {
        blacklistAbortRef.current.abort();
        blacklistAbortRef.current = null;
      }
      setBlacklistStatus('idle');
    }

    // Constraint state — clear on keystroke once the value no longer matches.
    // The constraint message disappears immediately when the player edits away
    // from the rejected password; it only re-appears on the next blur if still
    // violating.
    if (commonActive && !isCommonPassword(value)) setCommonActive(false);
    if (whitespaceActive && !hasLeadingOrTrailingSpace(value)) setWhitespaceActive(false);

    scheduleStrengthUpdate(value);
    // No blacklist call here — check fires on blur (handleBlur) or on Next tap
    // via the imperative fireBlacklistCheck handle.
  }

  // ─── Focus / blur (primary field) ───
  function handleFocus() {
    setIsFieldFocused(true);
    // Mark that the user has focused since the last check. If they then edit the
    // field while a check is in flight, handlePasswordChange will abort the check.
    // If they just re-focus without editing, this flag stays true but is harmless.
    hasFocusedSinceLastCheckRef.current = true;
  }

  function handleBlur() {
    setIsFieldFocused(false);
    // Reset the re-focus tracking flag — we're leaving the field now.
    hasFocusedSinceLastCheckRef.current = false;

    // ─── Blur-driven error state machine (brief 2026-05-26) ───
    // On blur: check current validity and update interaction state.
    // computeStrength is synchronous — use directly (not the debounced strengthResult).
    if (password.length > 0) {
      const { isValid: validAtBlur } = computeStrength(password);
      if (!validAtBlur) {
        // Invalid on blur → show error border + mark as interacted
        setHasInteracted(true);
        setBorderState('error');
      } else {
        // Valid on blur → ensure border is neutral (it should be, but confirm)
        setBorderState('neutral');
      }
    }
    // Empty field on blur: no state change — don't punish an empty-field blur.

    // ─── On-blur blacklist trigger ───
    // runBlacklistCheck guards internally: non-empty, all rules met, not cached.
    // Gated: when BLACKLIST_CHECK is off no call fires.
    if (FEATURES.BLACKLIST_CHECK) {
      runBlacklistCheck(password);
    }

    // ─── On-blur constraint checks (2026-06-09 scope) ───
    // Treated as if they were async server calls (production swap target).
    // Precedence whitespace > common is enforced in the constraint-message
    // derivation; set both flags here so the precedence logic has the latest
    // truth for both gates.
    if (password.length > 0) {
      setWhitespaceActive(hasLeadingOrTrailingSpace(password));
      setCommonActive(isCommonPassword(password));
    }
  }

  // ─── Toggle ───
  function handleToggle() {
    setIsRevealed((prev) => !prev);
  }

  // ─── Derived state ─────────────────────────────────────────────────────────
  const { ruleResults, isValid } = strengthResult;

  // ─── Constraint message (blur-driven gates) ───────────────────────────────
  // Both gates are blur-driven state — the constraint message only appears
  // after the player leaves the field. Precedence (when both fire):
  //   whitespace > common > additive
  const constraintMessage = whitespaceActive
    ? REJECTION_MESSAGE_WHITESPACE
    : commonActive
      ? REJECTION_MESSAGE_COMMON
      : null;

  // Floating label lift condition
  const primaryLifted = isFieldFocused || password.length > 0;

  // ─── Compute submit message ───
  // submitMessage is the string to show in the message slot.
  // null means "valid — hide the slot". Only computed/shown when hasInteracted is true.
  const submitMessage = (hasInteracted && !isValid)
    ? computeSubmitMessage(password, ruleResults)
    : null;

  // Final message for the field-error slot. Constraint gates take precedence
  // over the additive submitMessage — only one message in the slot at a time.
  // Both constraint messages appear pre-interaction (live on keystroke).
  const displayedMessage = constraintMessage || submitMessage;

  // Measure the field-error slot post-render to decide whether the icon
  // should sit centred (1 line) or pinned to the first line (2+ lines).
  // line-height: 20px (set in CSS), so >20px height means the text wrapped.
  // useLayoutEffect runs before paint, so the class toggle is applied
  // before the user sees the message.
  useLayoutEffect(() => {
    const el = fieldErrorRef.current;
    if (!el) return;
    if (!displayedMessage) {
      // Empty slot — fall back to single-line layout; no measurement needed.
      setIsFieldErrorMultiLine(false);
      return;
    }
    setIsFieldErrorMultiLine(el.offsetHeight > 20);
  }, [displayedMessage]);

  // ARIA describedby for the password input
  // Submit message takes priority when present; rejection notice is secondary info
  const ariaDescribedBy = [
    helperId,
    context === 'reset' ? infoBoxId : null,
    displayedMessage ? submitMsgId : null,
    blacklistStatus === 'rejected' ? rejectionNoticeId : null,
    errorMsg ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  // hasInputError: drives aria-invalid on the input. True when:
  // - External server error is present, OR
  // - Border state is error (blur-driven interaction state), OR
  // - A constraint gate (repeats / common-password) is currently surfaced.
  // The constraint message lives in the same slot as additive errors, so the
  // field underline must reflect error state for the visual to read as one.
  const hasInputError = !!(errorMsg || borderState === 'error' || constraintMessage);

  return (
    <div className="pf-root">
      {/* ─── Polite live region (screen reader only) ─── */}
      <div
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {liveText}
      </div>

      {/* ─── Helper text — sr-only; the checklist is the visible helper now ─── */}
      <p id={helperId} className="sr-only">
        {COPY.helper[context]}
      </p>

      {/* ─── Reset info box (reset context only) ─── */}
      {context === 'reset' && (
        <div
          id={infoBoxId}
          className="pf-info-box"
          role="note"
          aria-label="Reset password information"
        >
          <span className="pf-info-icon" aria-hidden="true">
            <InfoIcon size={14} />
          </span>
          {COPY.infoBox}
        </div>
      )}

      {/* ─── Primary field: floating label + underline input + toggle ─── */}
      <div
        className={[
          'pf-input-wrapper',
          isFieldFocused && !hasInputError ? 'pf-input-wrapper--focused' : '',
          hasInputError ? 'pf-input-wrapper--error' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Floating label */}
        <label
          htmlFor={fieldId}
          className={[
            'pf-float-label',
            primaryLifted ? 'pf-float-label--lifted' : '',
          ].filter(Boolean).join(' ')}
        >
          {COPY.label[context]}
        </label>

        <input
          ref={inputElementRef}
          id={fieldId}
          type={isRevealed ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={handlePasswordChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasInputError ? 'true' : undefined}
          className={[
            'pf-input',
            borderState === 'error' ? 'pf-input--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          spellCheck="false"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          data-form-type="password"
          placeholder=""
        />

        {/* ─── Show/hide toggle ─── */}
        <button
          type="button"
          className="pf-toggle"
          aria-label={isRevealed ? COPY.toggle.hide : COPY.toggle.show}
          onClick={handleToggle}
        >
          {isRevealed ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>

      {/* ─── SLOT 3: Submit message — count-based, blur-driven (brief 2026-05-26) ─────
          Reserved layout slot — always rendered to prevent CLS.
          Empty: aria-hidden="true", opacity 0, no visible content.
          Visible: aria-live="polite" announces on message changes.
          Silent while hasInteracted is false (user hasn't blurred yet).
          Clears immediately when password becomes valid.
          Icon: CircleAlertIcon (16px), uses currentColor (inherits message colour).
          ─────────────────────────────────────────────────────────────────────────── */}
      <div
        ref={fieldErrorRef}
        id={submitMsgId}
        aria-live="polite"
        aria-atomic="true"
        aria-hidden={displayedMessage ? undefined : 'true'}
        className={[
          'pf-field-error',
          displayedMessage ? 'pf-field-error--visible' : '',
          isFieldErrorMultiLine ? 'pf-field-error--multi-line' : '',
        ].filter(Boolean).join(' ')}
      >
        {displayedMessage && (
          <>
            <span className="pf-error__icon" aria-hidden="true">
              <CircleAlertIcon size={16} />
            </span>
            {displayedMessage}
          </>
        )}
      </div>

      {/* ─── External server error (below field underline, above meter) ─── */}
      {errorMsg && (
        <div
          ref={errorRef}
          id={errorId}
          role="alert"
          className={[
            'pf-error',
            errorDismissing ? 'pf-error--dismissing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="pf-error__icon">
            <AlertIcon size={16} />
          </span>
          {errorMsg}
        </div>
      )}

      {/* Strength meter removed 2026-06-09 — checklist below is the only
          typing-state indicator now. */}

        {/* ─── Checklist card (Figma 22017-1454 update) ───
            #fafafa background, 8px radius, 12px padding all sides,
            12px gap between header → rules → footer */}
        <div className="pf-checklist-card">
          <p className="pf-checklist-card-header">
            Make your password hard to guess. It needs:
          </p>

          <ul
            className="pf-checklist"
            aria-label="Password requirements"
          >
            {RULES.map((rule) => {
              const isMet = ruleResults[rule.id];
              const wasMet = ruleWasMet[rule.id];
              const isRegression = !isMet && wasMet;

              const itemClasses = ['pf-checklist-item'];
              if (isMet) {
                itemClasses.push('pf-checklist-item--met');
              } else if (isRegression) {
                itemClasses.push('pf-checklist-item--unmet-from-met');
              }

              return (
                <li key={rule.id} className={itemClasses.join(' ')}>
                  <span
                    className="pf-checklist-icon"
                    aria-hidden="true"
                    style={{
                      color: isMet ? '#15803D' : '#E4E4E7',
                    }}
                  >
                    {/* All rules are now mandatory — circle icons for all */}
                    <span className="pf-icon-unmet">
                      <CircleOutlineIcon size={20} />
                    </span>
                    <span className="pf-icon-met">
                      <CircleCheckIcon size={20} />
                    </span>
                  </span>

                  <span className="pf-checklist-text">
                    {rule.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="pf-checklist-card-footer">
            Hard to guess means skipping the obvious: your name, birthday or sequences like 1234
          </p>
        </div>

      {/* Old inline rejection notice removed 2026-06-09 — constraint messages
          (whitespace / common-password) now share the field-error slot above. */}

    </div>
  );
});

export default PasswordField;
