# Design Critic Review — 2026-05-26

## Verdict
**Proceed** — with one important fix before ship and a handful of polish items to track.

---

## Headline Observations

**1. The rework landed.** The shift from sandboxed device frame to single production screen with RegistrationHeader is the right call. The component now reads as native to the platform — not a prototype dropped into a white page. The floating-label underline field is coherent with the user's reference and the RegistrationHeader's visual register.

**2. The craft is high but one motion decision needs signing off.** The meter uses colour-transition-only (not the scaleX fill animation the motion spec described). The communicative goal is met, the timings are correct, but this is a deliberate deviation from a named spec decision and has not been formally cleared by motion-designer. It needs to be acknowledged as approved or reversed before ship.

**3. The empty helper-text slot works.** The visual space between the field underline and the meter track is clean. The sr-only helper preserves accessible wiring. No gap or awkwardness. This was the right call.

---

## Findings

### Critical

None that would block ship.

---

### Important

#### I1 — Meter fill animation deviation is unresolved
**What:** The build uses background-colour crossfade (180ms forward / 240ms backward) instead of the `scaleX(0→1)` fill animation specified in the motion spec. The scaleX classes exist in the CSS but are not wired. The builder flagged this as a deviation and asked motion-designer to confirm. That confirmation is not in the design-state.md or build log — it is unresolved.

**Why it matters:** The motion spec's scaleX animation was designed to give the "filling should feel like a reward" moment a directionality — the fill growing from left communicates progress. The colour-crossfade approach is less directional; segments simply change hue without a fill gesture. For Weak → Fair → Good → Strong progression, the absence of a left-to-right fill gesture is a subtle but real loss of that reward signal. For a spec that explicitly used the language "fill as reward," this matters.

**Suggested fix:** Motion-designer needs to formally sign off on the colour-transition-only approach or confirm that scaleX classes should be wired. This is not a design-critic call to make — it is a motion-designer confirmation. Flag it explicitly; do not ship without the answer.

---

#### I2 — "Continue" button label is contextually incorrect for reset and settings
**What:** `App.jsx` hardcodes the button label as "Continue" for all three contexts. The strategy (Section 3) specifies context-specific CTAs: "Set new password" for reset, "Update password" for settings. The current build exposes only the registration context by default (`?context=reset` / `?context=settings` are review-only URL params), but if the component is integrated into the actual platform, the Continue button label would be wrong in reset and settings flows.

**Why it matters:** Brief P5 requires that context changes affect copy throughout, not just in the field label. The button is the primary call to action — "Continue" in a reset flow is semantically wrong (you are not continuing a registration flow; you are setting a new password). Copy.md vocabulary confirms "continue" is for registration only.

**Suggested fix:** In `App.jsx`, read the context and derive the button label: `registration` → "Continue"; `reset` → "Set new password"; `settings` → "Update password". The PasswordField component correctly manages its own context-specific strings; App.jsx needs to follow suit.

---

### Notes

#### N1 — Toggle alignment on underline field: sits at `bottom: 0`, not vertically centred in the text area
**What:** The toggle is positioned `bottom: 0` on the wrapper, which aligns it to the underline rather than to the visual centre of the input text area. On the underline field (36px text height + 18px padding-top), this means the icon is visually low — close to the underline, not centred in the type zone.

**Why it matters:** On the boxed field, `bottom: 0; top: 50%` would centre the icon in the full field height. On the underline field, the padding-top shifts the visual centre upward. The icon currently reads as "resting on the underline" rather than "floating in the field." It is not broken, but it is slightly off — a slightly refined touch-target alignment would match the visual-decisions.md spec intent (toggle "vertically centred with the input text").

**Suggested fix:** Adjust the toggle to align with the input text baseline zone rather than the wrapper bottom. One approach: `top: calc(18px + 18px)` (padding-top + half the 36px input height) with `transform: translateY(-50%)`.

---

#### N2 — Meter track appears on field focus; checklist is already visible
**What:** Per design-state.md (user override), the checklist is visible before focus — always rendered. The meter track appears on first focus (with an opacity fade-in). This creates a mild visual seam: the user sees the checklist but not the meter until they tap the field.

**Why it matters:** The visual-decisions spec (Section 2.6) explicitly calls for showing the inactive four grey segments to prime users that a meter exists before they begin scoring. But the empty checklist rows (four circle-outline items + the plus item) are already visible, creating a partial picture: "here are the rules" without "here is how you'll be scored." For a pre-focus state, the checklist alone without the meter track reads slightly incomplete — the meter track appearing on focus resolves this, but the brief moment of checklist-without-meter could be slightly jarring on first load.

**Note:** This is an inherent tension in the user override (checklist always visible) combined with the spec (meter track on focus). The current implementation correctly follows both directives. It is worth noting for the user in case they want to reconsider which behaviour to apply consistently. Not a bug — an architectural seam.

---

#### N3 — Reset info box copy: "as soon as you save it" — slightly imprecise for the locked-out state
**What:** The reset info box reads: "Your new password works as soon as you save it." The copy is clean, Grade 4, no idiom, direct. However: in a password reset flow, the user typically saves the new password and is then redirected to sign in — the password "works" only after sign-in, not the moment they tap "Set new password." There is a nuance gap between "works when you save it" and "works when you next sign in."

**Why it matters:** P4 requires that copy be accurate without alarming. If a user taps "Set new password" and is redirected to the sign-in screen, their immediate reaction may be "wait, it's not working yet" — which is a micro-anxiety the copy promised to prevent. The content-writer rationale ("answers the locked-out user's core anxiety directly") is sound, but the precision question is worth raising.

**Suggested fix (minor):** Consider "Your new password is ready as soon as you continue." — this preserves the forward-facing tone while removing the "save" verb that implies a single terminal action, and avoids the precision gap. Or keep the current string and ensure the platform's post-submit state confirms success immediately. This is a judgment call for content-writer + platform team; flag it, don't block on it.

---

#### N4 — Three-context hanging together: review-mode context switching is invisible by design
**What:** Contexts are switched via URL params (`?context=reset`, `?context=settings`). The default state (registration) is the only one surfaced as a live screen. The reset and settings views require a URL change to see.

**Why it matters:** For platform integration, the three contexts need to be tested in their real frame — in a reset flow with a different page header, in a settings page with a current-password field above. The current review configuration gives the reviewer full component coverage but does not simulate the surrounding frame for reset and settings. This is a prototype limitation, not a design flaw.

**Note:** The component's internal behaviour across contexts (labels, info box, masking default) is correct per spec. This note is for the integration team — when this component lands in the actual platform, the reset context should be reviewed in the real reset page shell, not the registration-shell wrapper.

---

#### N5 — No page title or heading for the registration screen
**What:** The single registration screen (`App.jsx`) has no visible `<h1>` or step title. The RegistrationHeader shows step progress (arc, "Step 4 of 8" in aria-label) but there is no text heading on screen naming the step.

**Why it matters:** The visual hierarchy moves immediately from the header to the floating-label field. For users who skim-read or use screen readers, there is no text landmark announcing "this is the password step." The RegistrationHeader's aria-label ("Step 4 of 8") is machine-readable but not a heading. Platform convention may supply this, but the current prototype is missing it.

**Suggested fix:** Add a `<h2>` or `<h1>` (depending on page-level heading hierarchy) above the PasswordField: "Create a password" or "Secure your account." This is a platform-integration consideration — the component does not own the page heading, but the prototype should simulate it.

---

## Plan Alignment

### Tracking well

- **P1 (teach as they type):** Fully implemented. Checklist visible before typing, meter appears on focus, submit gate enforced via `aria-disabled`, no post-submit complexity rejection path exists.
- **P2 (same verdict through every channel):** Implemented. Colour + segment count + text label + sr live region fire simultaneously. `role="meter"` with `aria-valuetext` is correct.
- **P3 (show only what matters, get out of the way):** The user override (checklist stays visible always) is respected and correctly documented. In-list quieting (muted text + icon fill) carries the visual weight reduction.
- **P4 (calm the anxious user):** Amber not red throughout. No X icon. Circle-outline for unmet state. Error copy forward-facing. Easing curves are ease-out/ease-in-out — no spring, no bounce. Reset info box fade-in matches the "always part of the form" intent.
- **P5 (one component, context-aware):** Single component, context prop, copy strings change, zero logic/behaviour change between contexts. Confirmed by code inspection.
- **All copy strings verbatim from copy.md.** Checked against Section 12. The symbol rule ("A symbol makes it stronger"), the reset info box (period preserved), the toggle labels, and all live region strings match exactly.
- **Motion timing fidelity:** Forward 180ms / backward 240ms / checklist stagger 50ms offset / regression 280ms concurrent / error entry 220ms + 40ms delay / info box 240ms + 80ms delay — all correct per motion spec.
- **Accessibility architecture:** `aria-live="polite"` only, `aria-describedby` wired, `role="meter"`, `aria-hidden` on checklist icons, `aria-label` on `<ul>`, `aria-disabled` on Continue button — all correctly implemented.
- **Tokens:** All meter colours are the purpose-designed palette from visual-decisions.md §5.2, not raw platform tokens. Verified in index.css. The decision to share `--color-meter-weak-text` for both Weak and Fair is documented and justified.
- **RegistrationHeader port:** SVGs are verbatim from source. `colors.green → #378BDA` substitution is correct. `aria-label="Step 4 of 8"` is a reasonable placeholder.

### Drifted / requires attention

- **Meter scaleX animation (I1 above):** Builder deviation from motion spec, not formally resolved.
- **Continue button label (I2 above):** Hardcoded "Continue" in App.jsx does not respect context-specific CTA copy for reset and settings contexts.
- **Visual-decisions.md §6 (boxed field spec) is now superseded by the rework:** The visual-decisions document still describes a boxed border field with a full outline in Section 6. The rework replaced this with a floating-label underline field. The visual-decisions document has not been updated to reflect this. Not a blocking issue for ship, but it creates a documentation debt — the next person reading visual-decisions.md will find a field spec that does not match the built component.

---

## Craft Assessment

### Tone: landing correctly
"Calm confidence with warmth, dialled back from Mailchimp." The checklist icons (circle-outline for unmet, circle-check for met) are warm without being cheerful. The amber tier colours read as "in progress" not "error." The absence of red anywhere in the component is correct and felt. The error copy ("Something went wrong. Try a different password.") is forward-facing without being breezy. The reset info box tone ("Your new password works as soon as you save it.") is the right register — it answers an anxiety without over-reassuring.

### Typography: correct
The 13px/500 meter label reads as a caption-badge for the bar, not a headline. The 14px/400 checklist text is the right weight for an informational list — not so light it disappears, not so heavy it competes. The floating label at 11px/500 when lifted is legible and reads as a quiet annotation. The 16px input text correctly prevents iOS zoom.

### Spacing rhythm: mostly correct with one note
The `--space-xl: 20px` margin-bottom on the input wrapper (gap to meter row) is slightly loose. Visual-decisions.md §1.3 specifies 12px (`--space-md`) between field and meter. The implementation uses `--space-xl` (20px) on the wrapper itself, which spaces the meter further from the underline than the spec intended. This may be absorbed in the field — the floating label zone adds padding-top of 18px, so the perceived gap from the typed text to the meter may be correct. Worth checking at a device screen, but the 8px discrepancy could explain a slightly airless feeling between field and meter on narrow screens.

### Colour restraint: passes
The palette is tight — ink, muted, heading, accent blue, and the two meter families (amber and blue). No extraneous colour introduced in the rework. The toggle blue (#378BDA) matches the underline focus blue, reinforcing the platform accent without creating a new meaning.

### The Continue button: right pattern, right placement
52px height, full width, `--radius-md` (9px), font-size 16px/600. This reads as a first-class platform action, not a prototype stub. The disabled state (grey background, muted text) is clearly inactive without being harsh — it communicates "not yet" rather than "unavailable." The `aria-disabled` (not `disabled` attr) choice keeps the button keyboard-accessible and is correct for this pattern. The gate at Good-or-above is correctly wired. The only concern is the label (see I2).

### The floating label: reads correctly in the platform idiom
The 120ms ease-out lift is appropriately brisk — not so fast it's startling, not so slow it feels laggy. The at-rest size (14px/muted) and lifted size (11px/heading) are the correct values from the rework spec. The label stays within the field's max-width-minus-toggle calculation, which prevents collision with the eye icon. The label colour change (muted → heading on lift) is the correct two-variable transition — it confirms the field is active without over-emphasising the label.

### Taste benchmark
Does this sit comfortably next to the references? Against Mailchimp: the warmth-without-humour target is met. Against FanDuel Formation: structurally analogous, tonally more restrained (appropriate for this platform). Against GOV.UK: accessibility floor is clearly exceeded while warmth is added on top. Against 1Password/Apple: the "feedback-as-assistance" framing is achieved through the amber-not-red palette and the circle-outline (not X) unmet state. The implementation would not look out of place in any of those reference contexts, which is the correct outcome for a regulated gambling platform that wants to feel considered and calm.

---

## Persona Walkthrough

### Primary: New player, mobile, distracted
Can they create a strong password without abandoning the form? Yes. Checklist is visible from page load. Mobile default is revealed text (registration context, < 768px). The live counter replaces the static "At least 10 characters" string with `n of 10 characters` while the length rule is unmet — this is exactly the right affordance for a distracted mobile user trying to hit a target they can see. The Continue button is disabled until Good — no post-submit rejection. The meter gives them an at-a-glance verdict at each step. The amber "in progress" state does not alarm them. This persona is well served.

### Secondary: Existing player, password reset, possibly stressed, on mobile
Reset context adds the blue info box above the field. The info box answers the locked-out user's core question before they start typing. The field label is "New password" (not "Create a password" — correct register for someone who already has an account). The reset info box fade-in is calm, not a notification. The component does not dwell on why the user is here. The moderate concern (N3) about "works as soon as you save it" vs. "works after sign-in" is worth flagging to the content team but does not block this persona's core task.

### Existing player, account settings, deliberate change
Settings context: masked by default (correct — different shoulder-surfing calculation), no confirm field mismatch until blur, no info box (correct — lower emotional load). The component is visually identical to registration except for field labels. P5 is fully implemented. This persona can update their password without friction.

### Screen reader user
Architecture is correct: `aria-live="polite"`, `role="meter"`, `aria-valuetext`, `aria-describedby`, `aria-hidden` on icons, `aria-label` on `<ul>`. The live region fires on tier change and rule state change after the 300ms debounce — not on every keystroke. The submit-threshold announcement fires once at Fair → Good only. The pre-interaction `aria-valuetext="Not rated yet"` prevents a premature "Weak" announcement. This persona is well served, pending accessibility-reviewer's live VoiceOver/TalkBack verification.

### Low-vision / colour-blind user
Strength is encoded in: segment count (1–4), fill colour, and text label. Any single one of those three channels is sufficient to communicate the tier. The unmet/met distinction on checklist items is: icon shape (outline → filled) + text colour shift — not colour alone. Passes.

### Motor / touch user
Toggle is 44×44px, bottom-aligned to the underline. Checklist items are not interactive touch targets. The single toggle controls both fields. Password is revealed by default on mobile. The Continue button is 52px tall (full touch target). The toggle's `bottom: 0` alignment may be slightly low relative to the visual centre of the typed text (N1), but does not reduce the 44×44px touch target.

---

## Recommendation

**Proceed** — fix I2 (Continue button label per context) before integration into the real platform, and get a formal sign-off from motion-designer on the colour-transition-only meter approach (I1). Neither is blocking for a review pass; both need to be resolved before the component ships in production.

The craft is at the right level. The component feels like it belongs to the platform. The decisions layer coheres: strategy → visual decisions → copy → motion → build. The rework correctly replaced the sandboxed prototype with something that reads as production-ready. The gaps are specific, named, and fixable.
