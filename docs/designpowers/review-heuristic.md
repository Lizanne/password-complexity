# Heuristic Evaluation — 2026-05-26

**Evaluated against:** Nielsen's 10 Usability Heuristics + Cognitive Walkthrough
**Build reviewed:** `src/components/PasswordField.jsx` at `http://localhost:5175/` — three contexts via URL params (`?context=reset`, `?context=settings`). Reworked shell (floating-label + underline field, RegistrationHeader, single-screen layout).

---

## Verdict

**Revise** — one critical and two important findings before this ships. The core interaction (meter + checklist, live feedback, submit gate) is well-executed. The critical issue is the silent submit lockout: the Continue button is visually inert when gated but provides zero explanation when activated. This will confuse users who have typed a password they believe is fine and tapped Continue, hearing nothing back. Fix that and the form is solid.

---

## Cognitive Walkthrough Findings

The key tasks are walked below for each context. Persona: primary persona throughout is a new player on mobile registering an account — mixed digital literacy, distracted, not there to admire the form. For reset: an existing player who may be anxious or frustrated.

---

### Registration / Happy path

**TASK:** Focus field → type a sensible password → reach "Good" → tap Continue.

**Step 1: User taps the password field.**
- Will try the right effect? Yes. "Create a password" label floats cleanly. No ambiguity.
- Correct action visible? Yes. The underline field is recognisable as an input on iOS/Android conventions.
- Action matches expectation? Yes. Floating label at rest at 14px/muted is conventional.
- Feedback on progress? The meter track fades in (opacity 0→1, 200ms, 80ms delay) and the checklist is already visible (always-on per user override). **Partial** — a user who taps and immediately types fast may miss the meter track appearing, since it fades in 280ms after focus. The checklist is visible pre-focus so this is mitigated.

**Step 2: User types first character.**
- Feedback? Meter segment(s) fill. But the tier label text does not appear until `hasTyped && password.length > 0` — which is the same condition. **Wait: code check.** `showLabel` is `hasTyped && password.length > 0`. After first character, `hasTyped` is true and `password.length > 0` is true. The label should appear after the 300ms debounce resolves.
- **Friction point (H1):** From keystroke 1 until the 300ms debounce fires, the segments are lit (colour is live immediately in the CSS via state) but `tier` and `tierLabel` haven't updated yet. The initial state is `tier: 0` and `showLabel: false`. So after the first character, a segment fills amber, and no text label appears yet. The text label appears 300ms later (debounce). This is a 300ms gap where the user sees a lit amber segment with no word verdict. Likely imperceptible in practice, but technically H1 partial.
- Finding: Minor. The 300ms debounce gap means "Weak" appears slightly after the first segment lights — one brief beat where colour without text.

**Step 3: User types a recognisable pattern (e.g., "password1A" — 9 chars, mixed case, number).**
- All three mandatory rules except length: met visually. Length counter shows "9 of 10 characters." Clear. User understands they need one more character.
- Correct action available? Yes. Counter is specific.
- Feedback good? Yes. Length counter is a clear affordance.

**Step 4: User types 10th character — "password1Ab".**
- Length rule: meets. All three mandatory rules now met. Depending on zxcvbn score (dictionary word base), tier may still be Fair (pattern is weak entropy). User may see all three rules checked but meter still at "Fair" / amber, Continue still grey.
- **Friction point (H5/H1):** This is the moment of maximum cognitive load. All three required checklist items are ticked (quieted/grey icons filled), but the meter says "Fair" and Continue is still disabled. A user who scans the checklist and sees all ticks will reasonably believe they are done. The submit gate at "Good" is enforced by zxcvbn entropy, not rule completion alone — but the only thing the user sees is the checklist. The meter tier label is the only signal that something more is needed, and its colour (amber, small 13px text) is the only differentiator from "Good". 
- Finding: **Important (H5/H1).** A user who completes all visible checklist items but has a low-entropy password (dictionary base, sequential pattern) will see all items ticked but Continue still locked. There is no instructional copy at this point explaining "your password is too predictable even though the rules are met." The meter label "Fair" is visible but a distracted mobile user may not read it. The tier descriptions (`aria-describedby`) are screen-reader only — not visible.

**Step 5: User improves password to reach "Good" — Continue activates.**
- Feedback? Continue transitions from grey to blue (#378BDA) with 150ms background-color transition. Live region announces "Your password meets the requirements. You can continue."
- Good? Yes. The visual signal (grey → blue button) is clear.
- **Friction point (H1):** Button transition is 150ms ease-out which is fast. On lower-end devices this may feel instantaneous rather than drawing attention. Adequate.

**Step 6: User taps Continue.**
- App.jsx `handleSubmit` is a no-op in prototype. In production this would navigate. No concern here for the component itself.

**Overall Registration Happy Path: 1 important finding (H5: rules-met but entropy-gated lockout). 1 minor finding (H1: 300ms debounce gap on first label).**

---

### Registration / Backspace recovery

**TASK:** Focus → type a strong password → backspace past the length floor → recover.

**Step 1: User types a strong password (e.g., "Tr0ub4dor&3" — 11 chars, all rules met, Good/Strong).**
- All rules met, tier Good or Strong. Checklist items quiet (grey/muted). Meter shows 3–4 filled blue segments. Continue is blue/active.

**Step 2: User backspaces one character at a time, past 10-char threshold.**
- At 10th character deletion (now 1 char): length rule reverts.
- Checklist: `pf-checklist-item--unmet-from-met` class fires. Icon crossfades (filled → outline) at 280ms. Text brightens (muted → ink) at 280ms. Length counter appears: "1 of 10 characters."
- Meter: segment(s) drop (background-color transition 240ms backward). Tier drops to Weak/Fair. Continue goes grey.
- **Observation:** The icon crossfade at 280ms is deliberately slow (per motion spec, "accurate and calm, not punishing"). In practice: the user is actively backspacing, so the icon change at 280ms per key may lag visibly behind the typing gesture on mobile. A user rapidly hitting backspace may see multiple concurrent 280ms transitions, which could appear as a stutter or slow-to-respond indicator.
- Finding: Minor. Rapid backspace through multiple rule thresholds produces overlapping 280ms regressions. Not alarming, slightly laggy-feeling on mobile.

**Step 3: User has backspaced to 6 characters — length unmet, some other rules may still be met.**
- Counter shows "6 of 10 characters." Unambiguous. Good.
- User understands they need to type more. The counter is the clearest recovery guide available.

**Step 4: User types forward again to recover.**
- Forward: icon transitions are 150ms (faster than backward 280ms). Feels responsive. Meter re-lights blue as rules re-meet.
- Good. Recovery UX is clean.

**Step 5: What about field clearing — URL navigation?**
- The `?context=` URL param is read once at mount via `getContext()` — there is no `popstate` listener or route-aware reset. If a user navigates (e.g., back button, URL change), the component unmounts and state is lost. No issue — this is standard React behaviour. Nothing unexpected.
- **However:** If the platform's back-button navigation re-renders App.jsx (e.g., soft navigation in the platform SPA), the component state resets. Password field would be empty. No undo of typed content. This is normal browser/app behaviour, not a heuristic failure — but worth noting that the form has no session persistence.

**Overall Backspace Recovery: No critical findings. Minor finding on overlapping regression animations at speed. Recovery path (counter + meter) is clear.**

---

### Registration / Error path

**TASK:** User submits → server returns an error.

**Code-path analysis:** `App.jsx` passes no `externalError` prop to `PasswordField`. In production integration, a server error would need to be wired as `externalError={serverErrorMessage}` to the component. The component is ready to receive it via:
```
useEffect(() => {
  if (externalError) {
    setErrorMsg(externalError);
    setErrorDismissing(false);
  }
}, [externalError]);
```

When an `externalError` is set:
- The field's underline changes to amber-brown (`--color-field-error`: `#8B4513`).
- The input text colour shifts to amber-brown.
- An error `<div role="alert">` appears below the field with `AlertIcon` + error text, animated with `pf-error-in` (opacity + translateY, 220ms, 40ms delay).
- The error auto-dismisses (150ms fade-out) when the user starts typing again (`handlePasswordChange` → `setErrorDismissing(true)` → `setTimeout 150ms → setErrorMsg(null)`).
- The meter and checklist are unaffected — still visible, still functional.

**Walkthrough simulation:**

**Step 1: Server returns generic error "Something went wrong. Try a different password."**
- Error text renders with icon. `role="alert"` will interrupt screen reader users (note: `role="alert"` implies `aria-live="assertive"` — interrupts). This is correct behaviour for a server error.
- **H9 finding:** The error message is below the field. On mobile with the checklist below that, the error message slot may be above the keyboard's safe area. A user with the keyboard open may not see the error without scrolling. No scroll-to-error logic exists.
- Finding: **Important (H9).** No scroll-to-error on server error. On mobile with keyboard open, the error message may be hidden above the keyboard viewport. The component does not call `scrollIntoView` when `externalError` arrives. Compare: `limit-step.tsx` in the platform explicitly calls `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on error. This component does not.

**Step 2: User starts typing to dismiss the error.**
- Error fades out in 150ms. Clean.
- **H3 finding:** The error dismisses immediately on any keystroke — even a single character. If the user is slow-reading the error message while simultaneously having their hand near the keyboard, any accidental touch dismisses the error. For the generic error ("Something went wrong") this is recoverable. For the rate-limit error ("Too many attempts. Wait a few minutes"), the user needs to read and act — dismissing on first keystroke is too aggressive for error types that require reading time.
- Finding: Minor (H3). Error dismisses on first keystroke regardless of error type. Low risk for generic errors; slightly higher risk for rate-limit and reuse errors where the user needs to absorb the message.

**Step 3: User corrects the password and taps Continue again.**
- No concerns. Submit re-enabled if password meets gate.

**Step 4: Rate-limit error in reset context.**
- "Too many attempts. Wait a few minutes, then try again." — no countdown, no indication of when to retry. This is by design (copy.md rationale: specific times can be inaccurate). The user must simply wait and navigate away.
- **H3 concern:** There is no "Cancel" or "Back to sign in" affordance in the component itself. The user's only exit is the header back button, which is a no-op in the prototype. In production, the back button presumably navigates away. Acceptable — but worth noting the error does not offer a forward path for the locked-out user.
- Finding: Minor (H3). Rate-limit error in reset context has no forward navigation path within the component. The platform's RegistrationHeader back button is the only exit.

**Overall Error Path: 1 important finding (H9: no scroll-to-error on mobile). 2 minor findings.**

---

### Reset / Happy path

**TASK:** Focus field → type a new password → meet "Good" → save.

**Step 1: User lands on reset context.**
- The blue info box ("Your new password works as soon as you save it.") is visible above the field. It fades in (240ms, 80ms delay). Good — it answers the locked-out user's core anxiety immediately without being intrusive.
- Field label: "New password." Correct and minimal.
- **H2 observation:** The field label in reset is identical to the settings context ("New password"). This is the correct decision — context differentiation is handled by the info box and the surrounding page copy (outside the component's scope). Pass.

**Step 2–5:** Identical to registration happy path findings above. The one additional overlay is the blue info box — it adds reassurance and does not interfere with the typing interaction.

**Step 6: User meets "Good" — Continue activates.**
- Same as registration. Good.

**Reset / Backspace recovery:** Identical to registration. No additional friction in reset context.

**Reset / Error path:** See error-path analysis above. Rate-limit error is reset-specific — most relevant here. The info box and the rate-limit error render simultaneously in reset context (info box is persistent, error appears below field). No conflict, but the screen could become dense with: info box + field + error + meter + checklist. Not a layout failure, but a density note.

---

### Settings / Happy path

**TASK:** Navigate to settings context → change password → meet "Good" → save.

**Step 1: User arrives at settings context (`?context=settings`).**
- No confirm field (correct — `withConfirm` defaults to false for settings).
- No info box (correct — lower emotional load).
- Field label: "New password." Same as reset. Correct.
- **H6 observation:** The settings context has no visible reminder of the old password or any indication of "you are changing your current password." The field label "New password" and the helper text (sr-only: "Update your account password.") handle this. The visible UI is just the field, meter, and checklist — identical to what the user would see at registration. This is lean but may occasionally confuse a settings user who wonders whether their old password was correctly validated (the component has no "current password" field — that is outside its scope, presumably on the parent settings page).

**Step 2: Password reveal default in settings context.**
- Code: `defaultRevealed = context !== 'settings' && isMobileViewport()`. Settings is always masked by default. This is correct per decisions log ("settings always masked — deliberate change, different shoulder-surfing calculation").
- The toggle is visible and functional. User can reveal if needed. Good.

**Steps 3–5:** Identical to registration. No settings-specific friction.

---

## Nielsen's 10 — Scores

| # | Heuristic | Score | Notes |
|---|-----------|-------|-------|
| 1 | Visibility of system status | Partial | Meter appears on focus; tier label 300ms debounced. First-keystroke gap where colour is present but label text is absent. More significantly: checklist items can all show as met while Continue remains locked (entropy gate) — no in-UI explanation for the gap. |
| 2 | Match between system and real world | Pass | Vocabulary is plain ("password", "number", "symbol"). Tier labels (Weak/Fair/Good/Strong) are everyday adjectives. "A symbol makes it stronger" uses benefit framing without jargon. No vocabulary violations found. |
| 3 | User control and freedom | Partial | Back button is in the header. Field can be cleared by selection and retyping. Confirm field has no clear button — minor. More importantly: error messages dismiss on first keystroke regardless of type (see error path findings). No undo beyond standard OS text field behaviour. For this type of component, that is acceptable. |
| 4 | Consistency and standards | Partial | Within-component: consistent. Against platform: the Continue button's disabled state uses `--color-line` / `--color-muted` while the platform's `PrimaryButton` uses `--color-disabled` for locked state. The visual weight difference is subtle but creates a minor inconsistency. Floating-label convention is not used in the other registration steps reviewed (limit-step uses boxed/outlined cards, not floating-label inputs) — the password step is the first floating-label field in the registration flow. |
| 5 | Error prevention | Partial | The submit gate at "Good" is the core P1 delivery and it works — post-submit complexity rejections are architecturally impossible. However, the gate is silent: when the user taps Continue while below "Good", nothing happens (no shake, no tooltip, no focused error). The user must infer from the button's grey state that they cannot proceed. The checklist is the only guidance. Pass on the gate mechanism itself; fail on the explanation at the gate. |
| 6 | Recognition rather than recall | Pass | All four rules are always visible. The live counter replaces the static label while the length rule is unmet. The tier label is always visible once typing begins. The checklist is always on — user never needs to recall rules from memory. The "Good" threshold is not explicitly labelled as the submit threshold anywhere in the visible UI — a minor recall burden ("do I need Good or Strong?"). |
| 7 | Flexibility and efficiency of use | Pass | `autocomplete="new-password"` supports password managers. `spellCheck="false"`, `autoCapitalize="none"`, `autoCorrect="off"` prevent mobile interference. Show/hide toggle supports checking typed passwords. No accelerators needed for this interaction type. Paste support inherited from standard input behaviour — no paste blocking. |
| 8 | Aesthetic and minimalist design | Pass | Meter + checklist is compact. Helper text is sr-only (visual space freed). The reset info box is the one additive element and earns its place. No decorative text, no redundant labels. The symbol rule's `+` icon versus the mandatory `○` icon at small sizes (16px) is the one area where visual density is near the limit of clarity — the two icons are close at 320px viewport width. |
| 9 | Help users recognise, diagnose, and recover from errors | Partial | Error messages (copy.md §6) are clear, in plain language, and constructive. The one gap: no scroll-to-error logic when a server error arrives. On mobile with keyboard open, the error slot may be above the visible viewport. Users may see the error border on the underline but not read the text. The error also dismisses on first keystroke — aggressive for multi-word errors the user needs to absorb. |
| 10 | Help and documentation | Pass / N/A | The component is self-explaining: rules are visible, tier is visible, counter guides length. No external documentation needed. If a user is genuinely confused about what a "symbol" is, there is no tooltip listing accepted symbols (copy.md notes this as "only show if users are confused — not default visible"). This is a reasonable omission for the component's scope; the platform could add a contextual tooltip if analytics show confusion. |

---

## Critical Findings

**[H5/H3] Silent submit lockout — Continue button provides no feedback when activated below the "Good" threshold.**

When the user's password is below "Good" (Fair or lower), the Continue button is styled as disabled (`--color-line` background, `--color-muted` text) but is not `disabled` — it uses `aria-disabled` to remain keyboard-accessible. On tap/click, `handleSubmit` fires and immediately returns if `!isValid`. The user receives no feedback: no shake animation, no tooltip, no focused error message, no live region announcement. The only guidance available is the meter and checklist, which the user may have already scanned and considered satisfactory (particularly if all three mandatory checklist items are ticked but entropy is insufficient).

This is a meaningful gap for the primary persona (mobile, distracted, mixed literacy). A user who types "Password1" (10 chars, uppercase, lowercase, number — all three rules visually ticked) will see all checklist items quieted and tapped Continue expecting to move forward. The button does nothing. The meter says "Fair" in small amber text but there is no directive: no message saying "you need a stronger password to continue."

**Fix:** On Continue press while `!isValid`, either:
- Show a brief tooltip/popover near the button ("Your password needs to reach Good strength to continue"), or
- Set a transient state (`showGateExplanation`) that surfaces a short message above the button slot ("Make your password a bit stronger to continue"), or
- At minimum, shift focus to the meter/field and trigger a live region announcement ("Your password needs to be stronger. Keep adding to it.").

The `aria-disabled` button approach is correct for keyboard accessibility (WCAG 2.1.1) but needs a complementary explanation mechanism.

---

## Important Findings

**[H1/H5] All-rules-ticked / meter-still-Fair scenario has no explanatory signal.**

When all three mandatory checklist items are ticked (length, case mix, number all met) but zxcvbn scores the password as Fair rather than Good, the user sees a fully-ticked checklist with a still-amber meter and still-disabled Continue. The checklist implies they are done; the meter disagrees; but there is no copy bridging this gap. The tier description for "Fair" (`Your password is getting stronger. Check the list below to see what's left.`) is sr-only — sighted users never see it. The visual UI at this moment is: three ticked rules, one unlit blue symbol item, "Fair" in amber, grey Continue. A sighted user has to infer from the meter alone that something more is needed.

**Fix:** Consider surfacing the tier description as a brief inline hint below the meter when the tier is Fair and all mandatory rules are met. Something as simple as: "Your password meets the rules but is still predictable. Mix in more variety." This bridges the gap between checklist-completion and entropy gate. Alternatively, the Good/Strong tier threshold could be annotated on the meter itself (a subtle indicator or label).

**[H9] No scroll-to-error on server error injection.**

When `externalError` arrives, the component renders the error below the field with animation. On mobile with the keyboard open, this slot may fall above the keyboard's viewport boundary. The platform's `limit-step.tsx` demonstrates the pattern: it calls `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on error. This component does not. A user who submitted, received a server error, but whose view is at the checklist/Continue button level will miss the error text and only see the amber underline.

**Fix:** In the `externalError` `useEffect`, after setting `errorMsg`, call a ref scroll on the error element: `errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`. This matches the platform's error-scroll pattern.

---

## Notes

**Symbol rule recognisability (H6 partial note):** The symbol item uses a `+` circle-outline icon instead of the mandatory `○` circle-outline. The intent is clear to a designer: different icon = different rule type = optional. For a first-time user on mobile, the visual distinction between `○` (circle outline) and `⊕` (circle with plus, 16px) at a glance may be lost. The copy "A symbol makes it stronger" is the primary signal that this item is different — not the icon. This is probably fine; the copy carries the distinction more than the shape does. If user testing shows confusion, a small "(optional)" or dimmed baseline colour difference on the unmet symbol item would reinforce the distinction without breaking the vocabulary spec.

**isForward direction tracking (minor code observation):** The `isForward` variable is derived as `tier >= (prevTierRef.current ?? 0)`. But `prevTierRef` is updated inside the debounced callback — it reflects the last debounced tier, not the real-time tier. When the user backtracks slowly (one character at a time, each backspace triggering a new debounce), the `isForward` flag may momentarily be wrong between keystrokes. The visual consequence is the wrong CSS transition duration (180ms vs 240ms) for one brief tick. Barely perceptible; purely a polish note.

**Checklist visible before focus:** Per user override decision, the checklist is always visible — even before the user has focused or typed. This means on page load, the user sees: field (with label), toggle icon, four checklist items with unmet icons, and no meter. This is the correct decision (per decisions log) for predictability and reassurance. The unmet checklist on a fresh page load is slightly front-loaded (four instruction lines immediately visible) but does not create friction — it tells the user exactly what they need to do before they start.

**Context switching via URL param:** The `getContext()` function reads the URL param once at mount. No re-render on URL change. This is intentional and correct for review purposes. A production SPA integration would want the context to be a prop controlled by the parent router. No usability issue in the current form.

**ProgressAvatar step label:** "Step 4 of 8" is a hardcoded placeholder. The SVG arc is visually approximately half-complete (consistent with step 4). If the actual password step is a different position in the registration flow, this arc will mismatch the actual step — a minor H1 concern in production, not in this prototype.

---

## What Works Well

- **P1 is fully delivered.** The submit gate at "Good" is architecturally sound. Post-submit complexity rejections are impossible. This is the brief's core success criterion and it is met.
- **The live counter is a standout usability win.** "7 of 10 characters" is the clearest possible guidance for the length rule. It removes all ambiguity about how close the user is, without adding a separate progress bar or separate text element.
- **Backspace recovery is calm and clear.** The 280ms regression animation, slightly slower than forward transitions, correctly reads as "something changed" without alarming. The icon crossfade is noticeable without being punishing. P4 compliance is visible.
- **The reset info box earns its place.** "Your new password works as soon as you save it." answers the locked-out user's anxiety in one sentence. It appears at the top, before the field, so the user reads it before they do anything. Good placement and timing.
- **Vocabulary is clean throughout.** No jargon, no forbidden words. "At least one number," "A symbol makes it stronger" — these read correctly on a first scan and work for non-native English speakers.
- **Error copy is plain and constructive.** "Something went wrong. Try a different password." is as close to optimal as this context allows.
- **The `aria-disabled` button approach** keeps the Continue button keyboard-accessible while communicating its disabled state visually. Correct call — the gap is in the missing complementary explanation, not in the `aria-disabled` choice itself.
- **Password manager support is thorough.** `autocomplete="new-password"`, `data-form-type="password"`, browser-native reveal button suppression, paste allowed — all correct.

---

## Headline Observations

**1. The silent Continue button is the one thing most likely to cause real user confusion.** A user who has done what they think is right — filled the field, seen three items tick — and then tapped Continue to hear nothing back is in the worst possible state: they think they are done but they are stuck, with no explanation. This needs a fix before this ships. It does not require a redesign — a single explanation message on failed Continue tap resolves it.

**2. The all-rules-met / entropy-still-Fair gap needs a visible bridge.** zxcvbn correctly catches passwords like "Password1A" as Fair entropy despite meeting all three mandatory rules. The component has no visible copy for this moment. The tier description string exists (sr-only) but is not surfaced visually. Showing a brief hint at this state would close the gap between the checklist's "you're done" signal and the meter's "not yet" signal.

**3. The rest of the form is well-built against its brief.** The meter is clear, the checklist is informative without being heavy, the reset context is appropriately warmer than registration. These are real usability strengths, not just spec-checking passes.
