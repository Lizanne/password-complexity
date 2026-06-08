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

import { useState, useEffect, useRef, useId, useCallback, forwardRef, useImperativeHandle } from 'react';
import './PasswordField.css';
import { RULES, MIN_LENGTH, MAX_LENGTH } from './rules.js';
import { computeStrength } from '../hooks/useStrength.js';
import { checkPassword } from '../lib/passwordCheck.js';
import {
  hasConsecutiveRepeats,
  isWeakOrCommon,
  REJECTION_MESSAGE_REPEATS,
  REJECTION_MESSAGE_COMMON,
} from '../lib/commonPasswords.js';
import { FEATURES } from '../config/features.js';

/* ─── Copy strings — two-state meter rewrite 2026-05-26 ─── */
/*
 * REMOVED (superseded — four-tier system gone):
 *   tierLabels: ['Weak', 'Fair', 'Good', 'Strong']  → replaced by LABEL_WEAK / LABEL_STRONG
 *   tierDescriptions: [...]                          → deprecated; see copy.md §Deprecated
 *   TIER_NAMES: ['weak', 'fair', 'good', 'strong']  → replaced by two-state CSS modifiers
 */
const LABEL_WEAK   = 'Weak';
const LABEL_STRONG = 'Strong';

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
    /*
     * Strength change — only announced on Weak → Strong or Strong → Weak transitions.
     * Not announced on every keystroke. See scheduleStrengthUpdate for the gate logic.
     */
    strengthChange: (label) => `Password strength: ${label}`,
    ruleMet: {
      length:          'Length met — 8 or more characters',
      numberOrSpecial: 'Number or special character added',
      uppercase:       'Uppercase letter added',
    },
    ruleBroken: {
      length:          'Length no longer met — need 8 or more characters',
      numberOrSpecial: 'Number or special character no longer included',
      uppercase:       'Uppercase letter no longer included',
    },
    submitThreshold: 'Your password meets the requirements. You can continue.',
  },
  /* Inline rejection notice — verbatim from spec */
  rejectionNotice: 'This password is too common — please choose another.',
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

/* ─── Warning triangle icon — used for rejection notice ─── */
function WarningTriangleIcon({ size = 16 }) {
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
        d="M8 2L14.5 13.5H1.5L8 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
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

/* ─── Submit messages — count-based, 15 distinct strings (brief 2026-05-26) ─── */
/*
 * computeSubmitMessage(value, ruleResults) — returns the string to show in the
 * submit message slot, or null if all rules are met (slot should be hidden).
 *
 * Rule order for pair-key construction matches checklist order:
 *   length → numberOrSpecial → uppercase
 * Keys are sorted pairs: 'length+numberOrSpecial', 'length+uppercase',
 * 'numberOrSpecial+uppercase'.
 *
 * See docs/designpowers/copy.md §11.1 for the full table.
 */
/*
 * Message family (2026-06-08 — 3 rules: length, numberOrSpecial, uppercase).
 * 8 strings total: empty + 3 single + 3 pair + 1 generic. Pair keys are
 * sorted by RULE_ORDER so the unmet-rules array always yields the correct key.
 */
const SUBMIT_MESSAGES = {
  empty: 'Enter a password',
  single: {
    length:          'Use at least 8 characters',
    numberOrSpecial: 'Add a number or special character',
    uppercase:       'Add an uppercase letter',
  },
  pair: {
    'length+numberOrSpecial':          'Use at least 8 characters and add a number or special character',
    'length+uppercase':                'Use at least 8 characters and add an uppercase letter',
    'numberOrSpecial+uppercase':       'Add a number or special character and an uppercase letter',
  },
  generic: 'Your password needs a few more things',
};

/* Ordered rule IDs — matches checklist display order; load-bearing for pair keys. */
const RULE_ORDER = ['length', 'numberOrSpecial', 'uppercase'];

function computeSubmitMessage(value, ruleResults) {
  if (!value || value.length === 0) return SUBMIT_MESSAGES.empty;
  const unmet = RULE_ORDER.filter((id) => !ruleResults[id]);
  if (unmet.length === 0) return null;
  if (unmet.length === 1) return SUBMIT_MESSAGES.single[unmet[0]];
  if (unmet.length === 2) return SUBMIT_MESSAGES.pair[unmet[0] + '+' + unmet[1]];
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

  // Strength state — computed on debounce. Two-state model (2026-05-26).
  const [strengthResult, setStrengthResult] = useState({
    rulesMet:    0,
    ruleResults: { length: false, numberOrSpecial: false, uppercase: false },
    segmentsLit: 0,
    isStrong:    false,
    isValid:     false,
  });

  // Track which rules were previously met for regression detection
  const [ruleWasMet, setRuleWasMet] = useState({
    length:          false,
    numberOrSpecial: false,
    uppercase:       false,
  });

  // Server-side external error state
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorDismissing, setErrorDismissing] = useState(false);

  // Blacklist check state
  // 'idle' | 'checking' | 'accepted' | 'rejected' | 'timeout'
  const [blacklistStatus, setBlacklistStatus] = useState('idle');

  // Live region string
  const [liveText, setLiveText] = useState('');

  // Tracks previous isStrong value for live region gate (announce only on Weak↔Strong transition)
  const prevIsStrongRef = useRef(null);
  const debounceRef = useRef(null);
  /* F5 — stagger refs for live region queue */
  const announceTimersRef = useRef([]);
  /* F8 — ref for scrollIntoView on external error */
  const errorRef = useRef(null);
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
  const meterDescId = `pf-meter-desc-${uid}`;
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

  // ─── Debounced strength computation — two-state model (2026-05-26) ───
  const scheduleStrengthUpdate = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = computeStrength(value);
      const newIsStrong  = result.isStrong;
      const oldIsStrong  = prevIsStrongRef.current;

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

        /* F5 — Staggered live region announcements — two-state rewrite */
        if (value.length > 0) {
          announceTimersRef.current.forEach(clearTimeout);
          announceTimersRef.current = [];

          const queue = [];

          /*
           * 1. Strength state change — only on Weak → Strong or Strong → Weak transitions.
           *    oldIsStrong === null means first evaluation (post-empty field); announce
           *    the current state so the user hears their starting point.
           *    The gate prevents re-announcing on every keystroke within the same state.
           */
          const isFirstEval = oldIsStrong === null;
          const isStateChange = !isFirstEval && oldIsStrong !== newIsStrong;
          if (isStateChange) {
            const strengthLabel = newIsStrong ? LABEL_STRONG : LABEL_WEAK;
            queue.push({ msg: COPY.liveRegion.strengthChange(strengthLabel), delay: 0 });
          }

          /* 2. Rule met / broken — staggered 50ms after strength announcement */
          if (prev.ruleResults) {
            let ruleOffset = isStateChange ? 50 : 0;
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

          /* 3. Submit threshold — announced when crossing into Strong (all 3 rules met) */
          if (isStateChange && newIsStrong) {
            const lastDelay = queue.length > 0 ? queue[queue.length - 1].delay + 100 : 0;
            queue.push({ msg: COPY.liveRegion.submitThreshold, delay: lastDelay });
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

        prevIsStrongRef.current = newIsStrong;
        return result;
      });

      if (onChange) {
        // Reported isValid factors in BOTH the additive rules AND the constraint
        // gates (repeats, common-password). The local strengthResult.isValid
        // is "all rules met" — useful for the meter — but for the parent's
        // submission gate we also need to block a constraint failure, so a
        // password like Password1! (all rules met, but on the common list)
        // never reports as submittable.
        const constraintViolated = hasConsecutiveRepeats(value) || isWeakOrCommon(value);
        onChange(value, result.isValid && !constraintViolated);
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
      }
      scheduleStrengthUpdate(value);
      // No blacklist call here — check fires on blur or on Next tap via fireBlacklistCheck
    },
    // markInteracted: called by App.jsx on Next tap with invalid input.
    // Triggers the blur-driven state machine from the submit path.
    markInteracted() {
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
    // We pass the current password value from state (captured in closure at this render).
    // Gated: when BLACKLIST_CHECK is off no call fires.
    if (FEATURES.BLACKLIST_CHECK) {
      runBlacklistCheck(password);
    }
    // Note: common-password constraint is no longer blur-driven — it's derived
    // live from the password value (see commonActive in derived state below)
    // so the meter doesn't lag while typing a known-bad password.
  }

  // ─── Toggle ───
  function handleToggle() {
    setIsRevealed((prev) => !prev);
  }

  // ─── Derived state — two-state model (2026-05-26) ───
  const { ruleResults, segmentsLit, isStrong, isValid } = strengthResult;
  /*
   * isForward: true when segments are increasing or stable.
   * Used to select forward (180ms) vs backward (240ms) transition timing.
   * prevIsStrongRef holds the last committed isStrong value after debounce.
   * On first eval (null), treat as forward.
   */
  const isForward = prevIsStrongRef.current === null || isStrong || !prevIsStrongRef.current;
  // User override 2026-05-26: meter track + checklist always visible on page load.
  const showMeter = true;
  // Label visible whenever the player has typed any content — paired with the
  // segmentsLit floor (computeStrength returns at least 1 segment lit when
  // password.length > 0), so the bar always shows at least one red segment
  // when the label reads "Weak".
  const showLabel = hasTyped && password.length > 0;

  // ─── Constraint gates (2026-06-08) ─────────────────────────────────────────
  // Both gates derived live from the password value (keystroke-immediate) —
  // common-password was previously blur-driven to simulate a server call, but
  // that caused the meter to lag (showing Strong while typing a known-bad
  // password like Password1! until blur fired). Synchronous local lookup
  // means the on-blur delay served no purpose other than introducing the lag.
  // Precedence (when both could show): repeats wins over common.
  const repeatsActive     = hasConsecutiveRepeats(password);
  const commonActive      = password.length > 0 && isWeakOrCommon(password);
  const constraintMessage = repeatsActive
    ? REJECTION_MESSAGE_REPEATS
    : commonActive
      ? REJECTION_MESSAGE_COMMON
      : null;

  // Meter state — three internal values, two visible labels:
  //   'strong'        → all 3 rules met, no constraint violated → 3 green + "Strong"
  //   'not-accepted'  → all 3 rules met BUT a constraint gate is violated → renders
  //                     visually identical to Weak (1 red segment + "Weak" label).
  //                     The state is preserved as an internal flag so future logic
  //                     (e.g. submit-blocking) can distinguish it from regular Weak.
  //   'weak'          → anything else (fewer than 3 rules met)
  // The player-facing rejection signal is carried by the error slot copy
  // and the red field border — not by a third meter label.
  const meterState =
    isStrong && (repeatsActive || commonActive)
      ? 'not-accepted'
      : isStrong
        ? 'strong'
        : 'weak';

  // Visual collapse: not-accepted and weak both render as Weak. effectiveStrong
  // is the single source of truth the segments + label render against — keeps
  // the meterState string available for any future non-visual consumer.
  const effectiveStrong   = meterState === 'strong';
  const effectiveSegments = meterState === 'not-accepted' ? 1 : segmentsLit;
  const meterLabel        = effectiveStrong ? LABEL_STRONG : LABEL_WEAK;

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

      {/* ─── Hidden meter description (updated for aria-describedby) ─── */}
      {/* Two-state rewrite: tierDescriptions gone; Weak/Strong only (2026-05-26) */}
      <div id={meterDescId} className="sr-only">
        {showLabel
          ? (isStrong
              ? 'Your password is very hard to guess. You\'re ready to go.'
              : 'Your password is easy to guess. Keep going — the checklist below shows what to add.')
          : 'Enter a password to see its strength.'}
      </div>

      {/* ─── Helper text — sr-only; meter+checklist replace visual helper ─── */}
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
        id={submitMsgId}
        aria-live="polite"
        aria-atomic="true"
        aria-hidden={displayedMessage ? undefined : 'true'}
        className={['pf-field-error', displayedMessage ? 'pf-field-error--visible' : ''].filter(Boolean).join(' ')}
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

      {/* ─── Meter row ─── */}
      <div
        className={['pf-meter-track', showMeter ? 'pf-meter-track--visible' : ''].join(' ')}
      >
        <div className="pf-meter-row">
          {/* Tier label — above the bar; absent before first keystroke.
              Slot is always reserved (pf-meter-label-slot, min-height: 18px) so
              the bar does not shift down when the label appears on first keystroke.
              DOM order: label first, bar second — screen readers hear "Weak/Strong"
              before encountering the progress bar, natural reading order.
              aria-hidden="true" on the <span>: the polite live region in the sr-only
              div above handles strength announcements; this visual span is decorative. */}
          <div className="pf-meter-label-slot">
            <span
              className={[
                'pf-meter-label',
                showLabel
                  ? (effectiveStrong ? 'pf-meter-label--strong' : 'pf-meter-label--weak')
                  : '',
                !showLabel ? 'pf-meter-label--hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {showLabel ? meterLabel : ''}
            </span>
          </div>

          {/* Meter bar */}
          {/* ─── Meter bar — 3 segments, two-state model (2026-05-26) ─── */}
          {/*
           * aria-valuemax: 3 (segments, not tiers)
           * aria-valuenow: segmentsLit (0–3) when user has typed, else 0
           * aria-valuetext: 'Strong' | 'Weak' | 'Not rated yet'
           *
           * Segment class logic:
           *   isActive = hasTyped && password.length > 0 && segIndex < segmentsLit
           *   (segIndex is 0-based; segmentsLit is 1-based count — so seg 0 active when segmentsLit >= 1)
           *   Active + isStrong → pf-meter-segment--strong (green)
           *   Active + !isStrong → pf-meter-segment--progress (grey higher-emphasis)
           *   Backward transition: pf-meter-segment--backward modifier
           *
           * State change effect (2→3 rules): all 3 segments crossfade red→green simultaneously
           * because all share the same isStrong flag — no per-segment stagger needed.
           */}
          <div
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={hasTyped && password.length > 0 ? effectiveSegments : 0}
            aria-valuetext={showLabel ? meterLabel : 'Not rated yet'}
            aria-describedby={meterDescId}
            className="pf-meter-bar"
          >
            {[0, 1, 2].map((segIndex) => {
              const isActive = hasTyped && password.length > 0 && segIndex < effectiveSegments;
              const segClass = ['pf-meter-segment'];
              if (isActive) {
                segClass.push(effectiveStrong ? 'pf-meter-segment--strong' : 'pf-meter-segment--progress');
                if (!isForward) segClass.push('pf-meter-segment--backward');
              }
              return (
                <div
                  key={segIndex}
                  className={segClass.join(' ')}
                />
              );
            })}
          </div>
        </div>

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

        {/* ─── SLOT 2: Inline rejection notice ─────────────────────────────
            BLACKLIST_CHECK flag controls whether this slot renders at all.
            When false: null — no DOM node, no reserved space, no CLS risk
              (CLS is only a concern when the notice can actually appear; with
              the flag off it can never appear, so no slot is needed).
              CSS for .pf-rejection-notice and its sub-elements is preserved
              in PasswordField.css — see the comment block above those rules.
            When true: reserved layout slot, always rendered, visibility toggled.
              Empty: aria-hidden="true", no visible content. Zero layout shift.
              Visible (.pf-rejection-notice--visible): role="status" aria-live="polite".
            ─────────────────────────────────────────────────────────────── */}
        {FEATURES.BLACKLIST_CHECK && (() => {
          const isRejected = blacklistStatus === 'rejected';
          return (
            <div
              id={rejectionNoticeId}
              {...(isRejected ? { role: 'status', 'aria-live': 'polite' } : {})}
              aria-hidden={isRejected ? undefined : 'true'}
              className={['pf-rejection-notice', isRejected ? 'pf-rejection-notice--visible' : ''].filter(Boolean).join(' ')}
              style={{ marginTop: 'var(--space-lg, 16px)' }}
            >
              {isRejected && (
                <>
                  {/* Row 1: icon + status label */}
                  <div className="pf-rejection-notice__header">
                    <span className="pf-rejection-notice__icon" aria-hidden="true">
                      <WarningTriangleIcon size={16} />
                    </span>
                    <span className="pf-rejection-notice__label">Not accepted</span>
                  </div>
                  {/* Row 2: supporting text, indented to align with label */}
                  <p className="pf-rejection-notice__body">{COPY.rejectionNotice}</p>
                </>
              )}
            </div>
          );
        })()}
      </div>

    </div>
  );
});

export default PasswordField;
