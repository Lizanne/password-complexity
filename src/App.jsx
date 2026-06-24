/**
 * App.jsx — blur-driven errors + count-based submit message — 2026-05-26.
 *
 * What changed from on-blur blacklist slice (brief 2026-05-26):
 *
 *   SUBMIT MESSAGE OWNERSHIP MOVED TO PasswordField.jsx:
 *     - fieldError state REMOVED from App.jsx
 *     - onFieldErrorDismiss handler REMOVED
 *     - fieldError / onFieldErrorDismiss props REMOVED from PasswordField JSX
 *     - handleNextTap now calls markInteracted() on the PasswordField ref instead of
 *       setting a fieldError string. PasswordField computes the count-based message.
 *     - Imports of findFirstMissingRule, HINT_MESSAGES, EMPTY_HINT REMOVED
 *
 *   BUTTON STATE MACHINE (five-path):
 *     idle ─── tap, complexity met, no prior check or stale ──▶ checking ──┬─→ idle (accepted) → submit
 *       │                                                                  │
 *       │                                                                  ├─→ idle (rejected) → notice shown, no submit
 *       │                                                                  │
 *       │                                                                  └─→ idle (timeout) → submit anyway
 *       │
 *       ├── tap, empty OR invalid ───▶ markInteracted() + refocus (PasswordField shows count-based message)
 *       ├── tap, blacklist rejected ──▶ refocus only
 *       └── tap during checking ──────▶ no-op
 *
 *   UNCHANGED:
 *     - Blacklist check (BLACKLIST_CHECK flag), useEffect resolution, checking state
 *     - Success state, Start over, SpinnerIcon, CheckIcon
 *     - onBlacklistStatusChange wiring
 *     - Demo chips and handleDemoChipClick (flag-gated)
 *
 * Note: "Start over" is a demo affordance — the real platform would route to
 * onboarding/dashboard on success, not reset the form.
 *
 * DD-012: getContext() reads window.location.search at render time. This is fine for this
 * Vite/React demo shell but will cause hydration mismatch in Next.js. Flagged for platform
 * integration (use useSearchParams() in Next.js).
 */

import { useState, useRef, useEffect } from 'react';
import PasswordField from './components/PasswordField.jsx';
import RegistrationHeader from './components/RegistrationHeader.jsx';
import { FEATURES } from './config/features.js';
import {
  isCommonPassword,
  hasLeadingOrTrailingSpace,
} from './lib/commonPasswords.js';

const RADIUS_MD = '9px';

/* Context-aware button labels — copy.md §9.0 */
const BUTTON_LABELS = {
  registration: 'Next',
  reset: 'Set new password',
  settings: 'Update password',
};

/* Read optional ?context= param for quick context switching during review */
function getContext() {
  if (typeof window === 'undefined') return 'registration';
  const param = new URLSearchParams(window.location.search).get('context');
  if (param === 'reset' || param === 'settings') return param;
  return 'registration';
}

/* Spinner SVG — inline, minimal */
function SpinnerIcon({ size = 16 }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'reg-spin 0.8s linear infinite' }}
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2C6.48 2 2 6.48 2 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Check icon for success state */
function CheckIcon({ size = 20 }) {
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
      {/* two-state rewrite 2026-05-26: --color-meter-good-fill removed; use strong-fill green */}
      <circle cx="12" cy="12" r="10" fill="var(--color-meter-strong-fill)" />
      <path
        d="M7 12L10.5 15.5L17 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const context = getContext();

  // Password value and validity — reported by PasswordField via onChange
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Blacklist status — reported by PasswordField via onBlacklistStatusChange
  const [blacklistStatus, setBlacklistStatus] = useState('idle');

  // Button mode state machine: 'idle' | 'checking' | 'submitting' | 'success'
  // Note: fieldError state removed (brief 2026-05-26). Submit messages are now
  // internal to PasswordField.jsx, driven by hasInteracted state.
  const [buttonMode, setButtonMode] = useState('idle');

  // Ref to the PasswordField imperative handle (for programmatic setValue + focus + fireBlacklistCheck)
  // DD-013 resolved: replaced DOM querySelector with useImperativeHandle pattern.
  const passwordFieldRef = useRef(null);

  function handleChange(value, valid) {
    setPassword(value);
    setIsValid(valid);
  }

  function handleBlacklistStatusChange(status) {
    setBlacklistStatus(status);
  }

  function handleBack() {
    /* No-op in prototype — would navigate back in the platform */
  }

  // ─── Checking resolution ───
  // When buttonMode is 'checking' and blacklistStatus settles, resolve the check.
  // This handles both:
  //   (a) User tapped Next while check was already in flight (blur had already fired)
  //   (b) User tapped Next before blur — fireBlacklistCheck was called, button entered
  //       'checking', and this useEffect resolves when the check completes.
  //
  // Gated: when BLACKLIST_CHECK is off, buttonMode never reaches 'checking',
  // so this effect is a harmless no-op. The guard keeps intent explicit.
  useEffect(() => {
    if (!FEATURES.BLACKLIST_CHECK) return;
    if (buttonMode !== 'checking') return;
    if (blacklistStatus === 'checking') return; // still waiting

    if (blacklistStatus === 'accepted' || blacklistStatus === 'timeout') {
      // timeout: server is source of truth — submit anyway (client fallback)
      submitForm();
    } else if (blacklistStatus === 'rejected') {
      // rejected: inline notice is now showing — return to idle
      setButtonMode('idle');
    } else if (blacklistStatus === 'idle') {
      // Safety fallback: should not normally reach idle while checking
      setButtonMode('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blacklistStatus, buttonMode]);

  // ─── Submit simulation ───
  function submitForm() {
    setButtonMode('submitting');
    // Simulate server round-trip ~1.2s
    setTimeout(() => {
      setButtonMode('success');
    }, 1200);
  }

  // ─── Next tap handler ───
  //
  // State machine (final-scope rewrite 2026-06-09):
  //
  //   Path 1: empty or rules-not-met → markInteracted() + refocus.
  //             PasswordField shows the count-based submit message; no submit.
  //   Path 2: all 4 rules met → enter 'submitting' (loading state). After a
  //             short simulated server delay, run the constraint check:
  //             - whitespace or common-password violation → exit loading,
  //               surface the rejection message via setConstraintFlags(),
  //               refocus the field. No submit.
  //             - clean → continue to success after the rest of the simulated
  //               submit round-trip.
  function handleNextTap() {
    // Do not re-tap during loading / submitting / success
    if (buttonMode !== 'idle') return;

    // Path 1: rules not met → surface the additive submit message
    if (password.length === 0 || !isValid) {
      if (passwordFieldRef.current) {
        passwordFieldRef.current.markInteracted();
      }
      focusInput();
      return;
    }

    // Path 2: all 4 rules met → enter loading state, then run the on-blur
    // constraint check. Treated as if it were an async server call (it will
    // be in production); the 400ms delay mimics the latency.
    setButtonMode('submitting');
    setTimeout(() => {
      const whitespace = hasLeadingOrTrailingSpace(password);
      const common     = isCommonPassword(password);

      if (whitespace || common) {
        // Constraint violation → exit loading, surface the rejection message
        if (passwordFieldRef.current) {
          passwordFieldRef.current.setConstraintFlags({ common, whitespace });
        }
        setButtonMode('idle');
        focusInput();
        return;
      }

      // Accepted → finish the simulated submit and show success
      setTimeout(() => setButtonMode('success'), 800);
    }, 400);
  }

  // ─── Start over — resets all state to initial ───
  function handleStartOver() {
    setPassword('');
    setIsValid(false);
    setBlacklistStatus('idle');
    setButtonMode('idle');
    // Focus back to input after reset
    requestAnimationFrame(() => focusInput());
  }

  function focusInput() {
    // Uses the imperative handle exposed by PasswordField via forwardRef.
    // DD-013 resolved: no longer relying on DOM querySelector.
    if (passwordFieldRef.current) {
      passwordFieldRef.current.focus();
    }
  }

  // ─── Demo chip fill handler ───
  // Preserved for flag-restoration of BLACKLIST_CHECK demo chips.
  // DEMO ONLY — strip on platform integration.
  // Sets the password field to a preset value and focuses it.
  // Does NOT auto-submit — user must tap Next themselves.
  function handleDemoChipClick(value) {
    if (passwordFieldRef.current) {
      passwordFieldRef.current.setValue(value);
      // Focus after a microtask so state has settled
      requestAnimationFrame(() => {
        if (passwordFieldRef.current) passwordFieldRef.current.focus();
      });
    }
  }

  // ─── Button rendering ───
  //
  // Checking state: NOT disabled — tappable but subsequent taps are silent no-ops.
  //   (a11y principle: button must remain visible and focusable during the check)
  //   aria-busy="true" signals the in-progress state to AT.
  //   The button label + spinner are the only visual change — background stays idle.
  //   Only reachable when FEATURES.BLACKLIST_CHECK is true.
  //
  // Submitting state: disabled (user genuinely cannot re-tap during form submit).
  //
  // When BLACKLIST_CHECK is off: available modes are idle / submitting / success only.
  //   'checking' is dead code — the state declaration and CSS class stay in place for
  //   flag restoration, but the label and aria-busy conditions below exclude it.
  const isButtonDisabled = buttonMode === 'submitting';
  const isButtonBusy = (FEATURES.BLACKLIST_CHECK && buttonMode === 'checking') || buttonMode === 'submitting';
  const buttonLabel =
    (FEATURES.BLACKLIST_CHECK && buttonMode === 'checking') ? 'Checking…' :
    buttonMode === 'submitting' ? 'Creating account…' :
    BUTTON_LABELS[context] || 'Next';

  return (
    <div className="reg-screen">
      <RegistrationHeader onBack={handleBack} />

      <main className="reg-main">
        <div className="reg-content">
          <PasswordField
            ref={passwordFieldRef}
            context={context}
            onChange={handleChange}
            onBlacklistStatusChange={handleBlacklistStatusChange}
          />
        </div>

        <div className="reg-footer">
          {buttonMode === 'success' ? (
            /* ─── Success state: replace button with heading + Start over ─── */
            /* NOTE: Real platform would route to onboarding/dashboard here.
               This is a demo affordance only — see build-log. */
            <div className="reg-success" role="status" aria-live="polite">
              <span className="reg-success__check" aria-hidden="true">
                <CheckIcon size={20} />
              </span>
              <strong className="reg-success__heading">Account created</strong>
              <button
                type="button"
                className="reg-start-over"
                onClick={handleStartOver}
              >
                Start over
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={[
                'reg-continue',
                `reg-continue--${buttonMode}`,
              ].join(' ')}
              onClick={handleNextTap}
              disabled={isButtonDisabled}
              aria-busy={isButtonBusy ? 'true' : 'false'}
            >
              {isButtonBusy && (
                <span className="reg-continue__spinner" aria-hidden="true">
                  <SpinnerIcon size={16} />
                </span>
              )}
              {buttonLabel}
            </button>
          )}
        </div>

        {/* ─── DEMO ONLY — strip on platform integration ──────────────────────
            Try-these chips: click to fill the password field with a preset
            value. Demonstrates the three message surfaces and the success path.
            Not a production affordance — intentionally distinct from real UI.
            Gated by FEATURES.BLACKLIST_CHECK: chips are only meaningful when
            blacklist is active. When the flag is false, chips are hidden but
            all code (handler, JSX, CSS) is preserved for flag-restoration.
            ─────────────────────────────────────────────────────────────────── */}
        {FEATURES.BLACKLIST_CHECK && (
          <div className="demo-try-these" role="group" aria-label="Demo password presets">
            <div className="demo-try-these__divider" aria-hidden="true" />
            <p className="demo-try-these__label">Demo: try these</p>
            <div className="demo-try-these__chips">
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoChipClick('password')}
                aria-label="Fill field with password (demonstrates blacklist rejection while rules also fail)"
              >
                password
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoChipClick('P@ssw0rd')}
                aria-label="Fill field with P@ssw0rd (passes all 5 rules, blacklisted — demonstrates Path 3)"
              >
                P@ssw0rd
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoChipClick('MyN3wPass!')}
                aria-label="Fill field with MyN3wPass! (passes all 5 rules, not blacklisted — demonstrates success path)"
              >
                MyN3wPass!
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        /* ─── Screen shell ─── */

        .reg-screen {
          min-height: 100vh;
          min-height: 100dvh;
          background: #fff;
          display: flex;
          flex-direction: column;
          position: relative; /* for absolutely-positioned footer */
        }

        .reg-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 16px;
          /* bottom padding makes room for the fixed footer (80px) + safe area */
          padding-bottom: calc(96px + env(safe-area-inset-bottom));
        }

        .reg-content {
          flex: 1;
          padding-top: 80px; /* Figma: 80px top padding in main content area */
          padding-bottom: 24px;
        }

        /* ─── Footer / button area — fixed to viewport bottom ─── */
        /* Figma: absolute bottom-0, full width, divider gradient above content */

        .reg-footer {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 390px; /* mobile-only design max-width */
          background: #fff;
          /* Subtle gradient at the top of footer to fade content behind it */
          padding-top: 16px;
          padding-bottom: 16px;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          padding-left: 16px;
          padding-right: 16px;
        }

        /* Gradient divider at the top of the footer */
        .reg-footer::before {
          content: '';
          display: block;
          height: 16px;
          margin: -16px -16px 16px -16px;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
          pointer-events: none;
        }

        /* ─── Next button — Figma spec: 48px / 8px radius / Figtree 600 / #378BDA ─── */

        .reg-continue {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 48px;
          font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 150ms cubic-bezier(0.2, 0, 0, 1),
                      opacity 150ms cubic-bezier(0.2, 0, 0, 1);
        }

        /* Idle: always tappable — accent blue #378BDA (Figma spec, 3.32:1 AA Large pass) */
        .reg-continue--idle {
          background: var(--color-accent);
          color: #fff;
        }

        .reg-continue--idle:hover {
          background: #2d7dc7;
        }

        .reg-continue--idle:active {
          background: #2471b5;
        }

        .reg-continue--idle:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        /* Checking state CSS — CURRENTLY INACTIVE (flag-gated by FEATURES.BLACKLIST_CHECK).
           When the flag is false, buttonMode never reaches 'checking', so these rules
           have no effect. Preserved for restoration — do not remove.
           To re-activate: set FEATURES.BLACKLIST_CHECK = true in src/config/features.js. */

        /* Checking: same visual treatment as idle — spinner is the only change.
           Button stays tappable (no disabled attr) — cursor stays pointer.
           Subsequent taps are silent no-ops in handleNextTap (not prevented by CSS).
           aria-busy="true" signals the in-progress state to assistive technology. */
        .reg-continue--checking {
          background: var(--color-accent);
          color: #fff;
        }

        .reg-continue--checking:hover {
          background: #2d7dc7;
        }

        .reg-continue--checking:active {
          background: #2471b5;
        }

        .reg-continue--checking:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        /* Submitting: dimmed, not tappable */
        .reg-continue--submitting {
          background: var(--color-accent);
          color: #fff;
          opacity: 0.7;
          cursor: default;
        }

        /* Spinner inside button */
        .reg-continue__spinner {
          display: flex;
          align-items: center;
        }

        /* Spinner keyframe */
        @keyframes reg-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reg-continue {
            transition: none;
          }
          .reg-continue__spinner svg {
            animation: none;
          }
        }

        /* ─── Success state ─── */

        .reg-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 0;
          text-align: center;
        }

        .reg-success__check {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reg-success__heading {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          color: var(--color-ink);
        }

        .reg-start-over {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: var(--color-field-focus);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .reg-start-over:hover {
          color: #1A5399;
        }

        .reg-start-over:focus-visible {
          outline: 2px solid var(--color-field-focus);
          outline-offset: 2px;
          border-radius: 2px;
        }

        /* ─── Screen-reader utility ─── */
        .reg-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* ─── DEMO ONLY: try-these chips ─────────────────────────────────────
           Demo affordance added 2026-05-26. Strip on platform integration.
           Intentionally distinct from real UI — not a design system component.
           ─────────────────────────────────────────────────────────────────── */

        .demo-try-these {
          margin-top: 40px;
          padding-bottom: 32px;
          padding-bottom: max(32px, env(safe-area-inset-bottom));
        }

        .demo-try-these__divider {
          height: 1px;
          background: var(--color-line);
          margin-bottom: 16px;
        }

        .demo-try-these__label {
          margin: 0 0 10px;
          font-size: 12px;
          line-height: 16px;
          letter-spacing: 0.04em;
          color: var(--color-muted);
        }

        .demo-try-these__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Minimum 44px touch target via padding, chip itself can be smaller */
        .demo-chip {
          /* Reset */
          border: none;
          background: none;
          padding: 0;
          /* Chip sizing — transparent padding provides 44px touch target */
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          /* Visible chip */
          padding-inline: 12px;
          background: #fff;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          /* Typography */
          font-size: 13px;
          font-family: ui-monospace, Menlo, Monaco, monospace;
          color: var(--color-ink);
          line-height: 1;
          /* Behaviour */
          cursor: pointer;
          transition: border-color 120ms ease;
          white-space: nowrap;
        }

        .demo-chip:hover {
          border-color: var(--color-line-strong);
        }

        .demo-chip:focus-visible {
          outline: 2px solid var(--color-field-focus);
          outline-offset: 2px;
          border-radius: 8px;
        }

        @media (prefers-reduced-motion: reduce) {
          .demo-chip {
            transition: none;
          }
        }

        /* ─── Wider screens: centre column at 390px max-width ─── */
        /* Mobile-only design (390px); centred on wider screens */
        @media (min-width: 440px) {
          .reg-screen {
            align-items: center;
          }

          .reg-screen > header {
            width: 100%;
            max-width: 390px;
          }

          .reg-main {
            width: 100%;
            max-width: 390px;
          }
        }
      `}</style>
    </div>
  );
}
