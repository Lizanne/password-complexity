# Accessibility Review — 2026-05-26

**Reviewer:** accessibility-reviewer
**Build:** Reworked — single-screen platform shell (floating-label + underline field)
**Live at:** http://localhost:5175/ (registration default; `?context=reset`, `?context=settings`)
**Standard:** WCAG 2.2 AA minimum; AAA for meter colour states (brief requirement)

---

## Verdict

**Conditional pass — two fixes required before ship.**

The component is built with genuine care for accessibility. The meter colour system, checklist semantics, live region implementation, reduced-motion coverage, and touch targets are all solid. Two issues block ship: the Continue button's text fails WCAG 1.4.3 AA, and the confirm-field mismatch error has no live announcement. Both are targeted one-line fixes.

---

## Critical
*(Blocks ship — WCAG AA violations or broken screen reader paths)*

### C1 — Continue button: white text on #378BDA fails WCAG 1.4.3 AA

- **WCAG ref:** 1.4.3 Contrast (Minimum) — 4.5:1 required for text below large-text threshold
- **What I found:** The enabled Continue button renders white `#ffffff` text on `#378BDA` background. Measured ratio: **3.58:1**. At 16px / font-weight 600, this is below the large-text threshold (18px regular or 14pt/18.67px bold), so the 4.5:1 minimum applies. 3.58:1 fails.
  - Hover state (#2a7ccb background): 4.34:1 — also fails AA
  - Active state (#1e6bb8 background): 5.45:1 — passes
- **Who it affects:** Low-vision users reading the primary call-to-action in any ambient lighting; older users on mobile in bright environments; users with contrast sensitivity conditions (cataracts, glaucoma).
- **Required fix:** Change the enabled Continue button background from `#378BDA` to `#2672BD` (4.97:1) or darker. The button already uses `#1e6bb8` for its `:active` state, which passes at 5.45:1. Using `#1E5FA8` (the existing `--color-field-focus` token, 6.45:1) keeps visual consistency with the rest of the component's blue system and passes AA. The hover and active states should darken proportionally. Exact values: set `background: #1E5FA8` on `.reg-continue--enabled`; set hover to `#1A5399`; active can remain `#1e6bb8`.

---

### C2 — Confirm field mismatch error: no live announcement

- **WCAG ref:** 4.1.3 Status Messages — status messages must be programmatically determinable; 1.3.1 Info and Relationships
- **What I found:** When passwords don't match, a mismatch error appears below the confirm field after the user blurs it. The error div (`pf-confirm-error`) has no `role="alert"` and no `aria-live` attribute. The confirm input gains `aria-invalid="true"` and `aria-describedby` pointing to the error, but the error is not announced when it appears. A screen reader user who blurs the confirm field after entering a non-matching password will hear nothing — they must tab back to the confirm field to encounter the aria-invalid / describedby association.
- **Who it affects:** Screen reader users (VoiceOver, TalkBack, JAWS, NVDA) and any user relying on live region announcements. This is the most common error path — virtually every registration session will trigger it at least once.
- **Required fix:** Add `role="alert"` to the confirm mismatch error div. In `PasswordField.jsx` line 730–742, change:
  ```jsx
  <div id={confirmErrorId} className="pf-confirm-error">
  ```
  to:
  ```jsx
  <div id={confirmErrorId} role="alert" className="pf-confirm-error">
  ```
  This mirrors the primary error element's `role="alert"` pattern already used elsewhere in the component.

---

## Important
*(Should fix — AA edge cases, focus indicator edge case, minor screen reader gaps)*

### I1 — WCAG 2.4.11 focus indicator: underline alone does not meet the 3:1 minimum against the unfocused state

- **WCAG ref:** 2.4.11 Focus Appearance (Minimum) — new in WCAG 2.2 AA
- **What I found:** WCAG 2.4.11 requires the focused state to have a contrast ratio of at least 3:1 between the focused-state pixels and the same pixels in the unfocused state. The underline at-rest is `#d4d4d8` (1px). On focus it becomes `#378BDA` (2px). Contrast of `#378BDA` against `#d4d4d8`: **2.42:1** — below the 3:1 minimum. The underline also passes the adjacent-colour check (`#378BDA` vs white `#ffffff` = 3.58:1 ≥ 3:1), but the focus/unfocus pixel comparison is the normative test.
- **The fallback saves it — in supported browsers:** The `:has(.pf-input:focus-visible)` outline adds `2px solid #1E5FA8` at 4px offset. `#1E5FA8` vs white = 6.45:1, which comfortably passes 2.4.11. As of 2026, `:has()` has ~96%+ browser support. The component passes for the vast majority of real users.
- **Remaining gap:** Older browsers without `:has()` support receive only the 2.42:1 underline. Users on those browsers are unprotected.
- **Who it affects:** Low-vision keyboard users; keyboard-only users who rely on visible focus for navigation; any user on a browser without `:has()` support.
- **Required fix:** Two options — either option satisfies WCAG 2.4.11:
  - **Option A (preferred):** Darken the default underline so the focused/unfocused contrast ≥ 3:1. Change `--color-line-strong` (used as the at-rest underline) to a darker value, OR add a specific at-rest underline colour that achieves this. `#378BDA` (focused) vs `#a0a0a0` = 3.08:1 — that's the threshold; a rest underline no lighter than `#a0a0a0` would satisfy it. However, this may visually over-emphasise the underline at rest.
  - **Option B (simpler):** Add a `@supports` progressive enhancement: if `:has()` is not supported, fall back to a visible `outline` on the input itself. Example: add `.pf-input:focus { outline: 2px solid #1E5FA8; outline-offset: 4px; }` as the baseline, remove it with the `:has()` override for browsers that support it.

---

### I2 — Batched live region announcements may be truncated by screen readers

- **WCAG ref:** 4.1.3 Status Messages (advisory); best practice for live region design
- **What I found:** When a user types a password that crosses a tier boundary and meets multiple rules simultaneously (e.g., typing past 10 characters also triggers Good tier and submit threshold in one debounce cycle), all announcements are concatenated into a single string: `"Password strength: Good. Length met — 10 or more characters. Letter mix met — uppercase and lowercase. Number included. Your password meets the requirements. You can continue."` This single string can be ~170 characters. VoiceOver (iOS/macOS) and JAWS may truncate live region content exceeding approximately 75 characters or after a timeout. The most critical announcement — "Your password meets the requirements. You can continue." — may be cut.
- **Who it affects:** Screen reader users (especially VoiceOver on iOS, which is the primary mobile screen reader for the registration persona).
- **Recommended fix:** Prioritise announcements when multiple fire simultaneously. The submit-threshold announcement (`"Your password meets the requirements. You can continue."`) is most important. Consider announcing it last (it's already last in the array) AND splitting into separate `setTimeout` calls with small offsets (e.g., 50ms between each) to allow the screen reader to process each. Alternatively: limit simultaneous announcements to tier change + submit threshold only; rule-met announcements are supplementary when a tier change already fires.

---

### I3 — ProgressAvatar SVG `aria-label` on the wrong element

- **WCAG ref:** 4.1.2 Name, Role, Value; 1.1.1 Non-text Content
- **What I found:** In `RegistrationHeader.jsx`, the `aria-label="Step 4 of 8"` attribute is on the inner SVG (`ProgressAvatar`), not on the wrapper element or a heading. SVG `aria-label` has inconsistent support across screen readers — some read it, some do not. The surrounding `<div>` container for the avatar has no accessible name. VoiceOver on macOS reads SVG `aria-label` in some circumstances but not reliably when the SVG has no `role` attribute.
- **Who it affects:** Screen reader users who want context about their registration progress.
- **Recommended fix:** Add `role="img"` to the SVG element alongside the existing `aria-label`. This combination is reliably announced across VoiceOver, JAWS, and NVDA:
  ```jsx
  <svg role="img" aria-label="Step 4 of 8" width="42" height="42" ...>
  ```
  Alternatively, wrap the avatar in a `<div aria-label="Step 4 of 8" role="img">` and mark the SVG `aria-hidden="true"`.

---

## Notes
*(Worth tracking — can defer; no ship-blocker)*

### N1 — Error dismissal is silent for screen reader users

- **What I found:** The primary server-side error clears on first keystroke via a 150ms fade-out. There is no screen reader announcement when the error clears. A screen reader user hears the error on appearance (via `role="alert"`), then after typing a character, the error disappears. If they tab back to the field, they no longer encounter the error text (aria-describedby still references the now-empty error slot, but the content is gone). This is acceptable — clearing an error silently is the correct pattern (the new live region content about password strength is the positive signal).
- **Recommendation:** No change needed. The silent dismissal is correct. Worth noting because it was flagged as a concern in analysis.

### N2 — Live counter updates are not announced to screen readers

- **What I found:** The `{n} of 10 characters` counter in the length checklist item updates with every debounce cycle while the rule is unmet. The counter text is in the static checklist list — it has no `aria-live`. Screen reader users navigating to the checklist will see the current count, but they don't hear it announced live.
- **Recommendation:** Content-writer note (copy.md §4.1) says: "The counter updates via the live region, not by making the checklist item itself live." The live region already announces "Length met — 10 or more characters" when the rule is met. However, the intermediate progress (e.g., "7 of 10 characters") is never announced. This is probably intentional — announcing every debounce update would be extremely chatty. The live region announces the final state. This design choice is sound.
- **If desired:** Add an occasional announcement at specific thresholds (e.g., at 5 of 10) only, not every keystroke. This would require changes to the live region logic. Not necessary for WCAG compliance.

### N3 — `aria-atomic="false"` on live region may cause partial reads

- **What I found:** The live region uses `aria-atomic="false"`, meaning each node change is announced independently. Since the content is a simple text string (not structured content), this setting is functionally equivalent to `aria-atomic="true"` — the whole string is replaced at once. However, `aria-atomic="false"` is technically correct for a region that only ever contains a single text node. No action needed; noting for clarity.

### N4 — Mobile viewport detection is synchronous at mount

- **What I found:** `defaultRevealed` uses `window.innerWidth < 768` at component mount. This is fine for the current Vite/React client-only project but would break in SSR environments (Next.js, etc.) where `window` is undefined. The build log flags this. If this component is ever integrated into the platform's Next.js shell, a `useEffect` hydration pattern will be needed.
- **Recommendation:** Acceptable for current scope. Flag in the integration handoff to the platform team.

### N5 — Windows High Contrast Mode: unverified

- **What I found:** `forced-color-adjust: none` is applied to `.pf-meter-segment`. This preserves custom background-color values in Windows High Contrast Mode (WCHM), preventing the browser from overriding the segment fills. The tier coding by segment count (P2) provides a non-colour backup channel. However, in WCHM high-contrast white-on-black themes, some darker amber fills (`#A66C25`) may have lower visibility. This cannot be verified without a Windows device in WCHM.
- **Recommendation:** Test on Windows in High Contrast White and High Contrast Black modes before full production release. If segments are invisible in either mode, the fix is to add CSS `@media (forced-colors: active)` overrides using `HighlightText` / `ButtonFace` / `Highlight` SystemColor keywords as fallbacks.

### N6 — Checklist visible before first focus (user-overridden spec deviation)

- **What I found:** The checklist is rendered on component mount, visible before the user has interacted. This matches the explicit user direction override (strategy was: visible on focus). No accessibility concern — a static list visible at all times is unambiguous.
- **Recommendation:** No action. Screen reader users navigating past the checklist before interacting will encounter the requirements list. The `aria-label="Password requirements"` on the `<ul>` provides context. This is a benefit, not a problem.

### N7 — Continue button disabled state has adequate contrast, but "disabled" is ambiguous

- **What I found:** The disabled Continue button uses `color: var(--color-muted)` `#52525b` on `background: var(--color-line)` `#e4e4e7`. Contrast: 6.09:1 — passes AA. Good. However, `aria-disabled="true"` (without a `disabled` attribute) means the button is fully interactive to click/tap, but the `handleSubmit` function silently no-ops. There is no announcement to the screen reader when the user activates a disabled button. Screen reader users may not understand why the button did nothing.
- **Recommendation:** The live region covers this case — when strength reaches Good, the announcement "Your password meets the requirements. You can continue." fires. Before that threshold, users know from the checklist and meter that conditions aren't met. Acceptable as-is, but consider adding a brief `aria-describedby` on the disabled button pointing to a hidden string like "Complete the password requirements above to continue."

---

## Contrast Audit

All ratios computed using WCAG 2.2 relative luminance formula.

### Text contrast (WCAG 1.4.3 — AA: 4.5:1 for normal text, 3:1 for large; AAA: 7:1)

| Element | Foreground | Background | Ratio | AA | AAA |
|---------|-----------|-----------|-------|-----|-----|
| Ink text (unmet rules, error) | `#18181b` | `#ffffff` | 17.72:1 | PASS | PASS |
| Muted text (met rules) | `#52525b` | `#ffffff` | 7.73:1 | PASS | PASS |
| Muted text vs page bg | `#52525b` | `#f4f4f5` | 7.03:1 | PASS | PASS |
| Heading / lifted label | `#4a4a4a` | `#ffffff` | 8.86:1 | PASS | PASS |
| Float label at rest | `#52525b` | `#ffffff` | 7.73:1 | PASS | PASS |
| Meter Weak/Fair label (13px med) | `#6F4A1C` | `#ffffff` | 7.86:1 | PASS | PASS (brief req) |
| Meter Weak/Fair label vs page bg | `#6F4A1C` | `#f4f4f5` | 7.15:1 | PASS | PASS |
| Meter Good label (13px med) | `#16548E` | `#ffffff` | 7.80:1 | PASS | PASS (brief req) |
| Meter Good label vs page bg | `#16548E` | `#f4f4f5` | 7.09:1 | PASS | PASS |
| Meter Strong label (13px med) | `#0F4A80` | `#ffffff` | 9.08:1 | PASS | PASS (brief req) |
| Info box text | `#18181b` | `#E8F0FA` | 15.42:1 | PASS | PASS |
| **Continue button (enabled) — FAIL** | `#ffffff` | `#378BDA` | **3.58:1** | **FAIL** | fail |
| Continue button hover | `#ffffff` | `#2a7ccb` | 4.34:1 | **FAIL** | fail |
| Continue button active | `#ffffff` | `#1e6bb8` | 5.45:1 | PASS | fail |
| Continue button (disabled) | `#52525b` | `#e4e4e7` | 6.09:1 | PASS | fail |

### Non-text contrast (WCAG 1.4.11 — 3:1 minimum for UI components)

| Element | Colour | Background | Ratio | 3:1 |
|---------|--------|-----------|-------|-----|
| Meter track (inactive) | `#929292` | `#ffffff` | 3.11:1 | PASS |
| Meter Weak fill | `#A66C25` | `#ffffff` | 4.38:1 | PASS |
| Meter Fair fill | `#B37726` | `#ffffff` | 3.76:1 | PASS |
| Meter Good fill | `#2878C8` | `#ffffff` | 4.55:1 | PASS |
| Meter Strong fill | `#1558A0` | `#ffffff` | 7.15:1 | PASS |
| Toggle eye icon | `#378BDA` | `#ffffff` | 3.58:1 | PASS |
| Back arrow chevron | `#378BDA` | `#ffffff` | 3.58:1 | PASS |
| Checklist unmet icon | `#52525b` | `#ffffff` | 7.73:1 | PASS |
| Met icon (checklist + meter) | `#16548E` | `#ffffff` | 7.80:1 | PASS |
| Error icon/border | `#8B4513` | `#ffffff` | 7.10:1 | PASS |
| Focus underline (focused) | `#378BDA` | `#ffffff` | 3.58:1 | PASS |
| Focus underline vs unfocused | `#378BDA` | `#d4d4d8` | **2.42:1** | FAIL (2.4.11) |
| Focus ring fallback | `#1E5FA8` | `#ffffff` | 6.45:1 | PASS |

**Note on meter fill claims in visual-decisions.md:** The design doc states Weak fill is 4.38:1 and calls this a pass. At the non-text 3:1 threshold, it does pass. The design doc's table header says "Pass?" against a 3:1 check — this is correct. No error in the docs.

### RegistrationHeader

| Element | Colour | Background | Ratio | Notes |
|---------|--------|-----------|-------|-------|
| Avatar person silhouette | `#4A4A4A` | `#ffffff` | 8.86:1 | PASS |
| Progress arc (blue) | `#4A89DC` | `#ffffff` | 3.49:1 | PASS non-text |
| Progress track (grey) | `#DCDCDC` | `#ffffff` | 1.37:1 | Below 3:1 — decorative track, non-functional |

**Note on progress track:** `#DCDCDC` vs white at 1.37:1 fails non-text 3:1. However, this element is purely decorative (the track behind the progress arc) — it conveys no information by itself; the filled arc and the `aria-label="Step 4 of 8"` on the SVG carry the meaning. This is borderline: WCAG 1.4.11 applies to "UI components" — a decorative track background arguably is not a UI component. Flagging as a note rather than a failure.

---

## Reduced-Motion Audit

All 13 animations from motion.md §11, plus the rework-added floating label transition.

| Animation | Full motion | prefers-reduced-motion: reduce | Status |
|-----------|-------------|-------------------------------|--------|
| 1. Meter forward tier change | background-color 180ms | transition: none | COVERED |
| 2. Meter backward tier change | background-color 240ms | transition: none | COVERED |
| 3. Meter label first appearance | opacity 200ms | transition: none | COVERED |
| 4. Checklist — rule meeting | icon crossfade 150ms + text 200ms | transition: none (both) | COVERED |
| 5. Checklist — rule breaking | concurrent 280ms | transition: none | COVERED |
| 6a. Field focus (underline) | background + height 150ms | transition: none | COVERED |
| 6b. Field blur (underline) | background + height 120ms | transition: none | COVERED |
| 6c. Meter track on focus | opacity 200ms, 80ms delay | transition: none; opacity: 1 instantly | COVERED |
| 7a. Error appearance | opacity + translateY(-4px) 220ms | opacity:1, transform:none, animation:none | COVERED |
| 7b. Error dismissal | opacity 0, 150ms | animation:none, opacity:0 | COVERED |
| 8. Toggle press feedback | background flash 80ms+160ms | background:transparent, transition:none | COVERED |
| 9. Info box mount | opacity 240ms, 80ms delay | animation:none, opacity:1 | COVERED |
| Floating label lift | transform + font-size + color 120ms | transition: none | COVERED |

**Verdict: PASS.** All 13 spec animations and the floating label have correct `prefers-reduced-motion: reduce` alternatives. State changes remain visible (icon swaps, colour changes) — the alternatives are not "remove all feedback," they are "instant feedback." This is the correct interpretation of reduced-motion.

**Vestibular risk: LOW.** Maximum translateY in the entire spec is 4px. No looping animations. No rotation, zoom, or parallax. Consecutive tier animations cannot overlap (300ms debounce > 240ms max animation). Motion-designer's vestibular assessment is confirmed.

---

## ARIA Audit

### What works correctly

**Live region:** `role="status" aria-live="polite" aria-atomic="false"` — correct. Separate from the meter and checklist. Updates only on tier change and rule state change (via debounce). Never assertive during progressive typing.

**Meter semantics:** `role="meter" aria-label="Password strength" aria-valuemin="0" aria-valuemax="4" aria-valuenow={0–4} aria-valuetext={tierLabel}` — correct. Pre-interaction `aria-valuetext="Not rated yet"` prevents premature "Weak" announcement. `role="meter"` is semantically accurate (strength can go backwards; `role="progressbar"` would be wrong). `aria-describedby` correctly points to the hidden tier description element that updates with contextual guidance.

**Checklist:** `<ul aria-label="Password requirements">` — correct. Icons are `aria-hidden="true"`. Text carries the state. Static item text (same string met/unmet) means the screen reader doesn't get confused by text changes. Live region handles state announcements.

**Symbol rule:** `<li>` with text "A symbol makes it stronger" — neutral, informational tone. No `aria-invalid`, no checkbox/radio role, no failure language. Correctly does not announce as a failed requirement. Live region announces "Symbol added — your password is now stronger" when met.

**Primary field:** `<label htmlFor={fieldId}>` with floating label — correctly associated. `aria-describedby` includes helper text (sr-only), info box (reset context), and error (when present). `aria-invalid="true"` on error state. `autoComplete="new-password"`, `spellCheck="false"`, `autoCapitalize="none"` — all correct for a password field.

**Toggle button:** `type="button"` (not submit), `aria-label` updates dynamically between "Show password" / "Hide password". SVG icons are `aria-hidden="true" focusable="false"`. Correct and consistent with content-writer spec.

**Continue button:** `aria-disabled={!isValid}` (not `disabled` attribute) — keeps button in tab order when gated, satisfying WCAG 2.1.1 keyboard access. `type="button"` prevents unintended form submission.

**RegistrationHeader back button:** `type="button"` with `aria-label="Back"`, 44×44 hit target, SVG `aria-hidden="true"`. Correct.

**Error message (primary):** `role="alert"` — assertive, announces immediately on appearance. The strategy said "no assertive" but this applies to progressive typing feedback; using `role="alert"` for a server-side error message is the WCAG-recommended pattern and is appropriate here.

**Info box (reset context):** `role="note" aria-label="Reset password information"` — informational landmark, correctly labelled. Referenced in password field's `aria-describedby` chain.

### Issues found

**Confirm mismatch error — no live announcement (see C2 above):** `pf-confirm-error` div has no `role="alert"`. Error appears silently after blur. Fix: add `role="alert"`.

**ProgressAvatar SVG — unreliable `aria-label` (see I3 above):** `aria-label` on SVG without `role="img"` has inconsistent screen reader support. Fix: add `role="img"` to the SVG.

### DOM order

Matches copy.md §11 specification. Reading order: live region (empty, sr-only) → meter description (sr-only) → helper text (sr-only) → info box (reset only) → label → input → toggle → error (if any) → meter → checklist → confirm section. Logical and matches visual scanning order.

### `aria-describedby` chain on primary field

Pre-interaction: `{helperId}` (sr-only helper text)
Reset context: `{helperId} {infoBoxId}`
With error: `{helperId} {errorId}` (or `{helperId} {infoBoxId} {errorId}` in reset)
Screen readers read this chain when focusing the field — they hear the helper text, then any error. The meter description is on the meter element itself (separate `aria-describedby`), not on the input — correct separation.

---

## Headline Observations

**1. The colour work is the best thing in this build.** The purpose-designed meter palette achieves WCAG AAA on all four tier labels (7.86–9.08:1 on white) and 3:1+ on all four segment fills. The decision to reject platform tokens and design bespoke swatches was the right call — it is rare to see meter colours this carefully verified. The error colour (`#8B4513` amber-brown at 7.10:1) is a considered choice that reinforces the "not an error, a state" principle without sacrificing legibility.

**2. The Continue button is the only text contrast failure, and it's the primary action.** `#378BDA` with white text is a classic false-confidence colour — it looks accessible but measures at 3.58:1. The fix is a simple background-colour change to the darker end of the existing blue system (the focus colour `#1E5FA8` is already in the token set and passes at 6.45:1). This must be fixed before ship.

**3. The screen reader experience for progressive feedback is thoughtful and largely correct.** The live region is polite, debounced, and appropriately scoped. The symbol rule reads as invitation, not failure. The submit-threshold announcement fires exactly once. The batched-announcement truncation risk (I2) is the one rough edge in an otherwise well-designed SR flow.

---

## Design Debt Register

The following Minor findings are not required for ship but must not be lost. They are recorded here for the design-debt-tracker.

| ID | Finding | Where | Effort |
|----|---------|-------|--------|
| DD-1 | Live counter progress (e.g., "7 of 10") not announced to SR users — only final "met" state announced | `PasswordField.jsx` → live region logic | Small — add threshold announcements at e.g. 5 chars |
| DD-2 | Error dismissal (server error clears on keystroke) has no SR announcement | `PasswordField.jsx` → error handling | Small — optional, acceptable silence |
| DD-3 | Continue button: no describedby hint when disabled ("complete requirements above to continue") | `App.jsx` → Continue button | Small |
| DD-4 | Windows WCHM unverified — needs real-device test | `PasswordField.css` → `forced-color-adjust` | Test task, not code change |
| DD-5 | Progress track `#DCDCDC` in RegistrationHeader is below 3:1 non-text contrast (decorative, borderline) | `RegistrationHeader.jsx` | Small — darken track to #ADADAD (3:1) |
| DD-6 | Mobile reveal default uses synchronous `window.innerWidth` — SSR-unsafe | `PasswordField.jsx` → `defaultRevealed` | Medium if/when SSR integration |
