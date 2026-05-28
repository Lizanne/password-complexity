# Synthetic User Testing — 2026-05-26

**Build tested:** `src/App.jsx` + `src/components/PasswordField.jsx` post-fix-round (F1–F9 applied), served at http://localhost:5175/
**Contexts:** registration (default), `?context=reset`, `?context=settings`
**Method:** Code-and-markup walkthrough as each named persona, with assistive-tech behaviour inferred from ARIA + DOM order + CSS.

## Personas tested
- **Jordan** — low vision; 200% browser zoom + macOS VoiceOver; iPhone 13, 5G, indoors; first-time registration; calm-but-in-a-hurry.
- **Priya** — Hindi-first, working English; Pixel 6 in moderate sunlight; reset flow (locked out); frustrated.
- **Marcus** — motor impairment (rheumatoid arthritis); tablet + stylus + speech-to-text; settings flow (voluntary, unhurried).
- **Sam** — ADHD, divided attention (kids in background); Pixel Fold (sometimes folded); registration; scanning, not reading.
- **Ana** — baseline (no impairment); iPhone 15 Pro on home WiFi; registration.

---

## Pre-flight: Build does not render

Before any persona walkthrough completes, one runtime defect dominates.

**`src/components/PasswordField.jsx` lines 352–361 form a `useEffect` whose dependency array references `showBridgingHint`, `tier`, and `allMandatoryMet`. Those three `const`s are declared at lines 492–506 — i.e., ~140 lines after the effect that depends on them.**

JavaScript `const` declarations are block-scoped and exist in a Temporal Dead Zone until their declaration line is reached. When React evaluates the function-component body top-to-bottom, the `useEffect` call site at line 352 attempts to evaluate the deps array immediately — *before* the consts are defined. This throws:

```
ReferenceError: Cannot access 'showBridgingHint' before initialization
```

Verified by direct simulation (Node 22, same lexical rules as V8 in the browser).

**Impact:** The `PasswordField` component crashes on first render. With no error boundary in `App.jsx` or `main.jsx`, the entire screen renders blank (or a React dev-mode error overlay in development). **Every persona × every task is blocked before they can begin.**

**Fix (one line):** Move the F7 useEffect below the `const showBridgingHint = ...` declaration (after line 506). Or equivalently, lift `showBridgingHint` / `tier` / `allMandatoryMet` derivations earlier in the body, above line 352.

The walkthroughs below assume this fix has been applied — otherwise the matrix is uniformly "blocked / crash" and the report ends here.

---

## Barrier matrix (assuming TDZ crash is fixed)

| Persona | T1 Happy | T2 Backspace | T3 Mismatch | T4 Locked tap | T5 All-met-Fair |
|---------|----------|--------------|-------------|---------------|-----------------|
| Jordan  | pass (slow) | barrier | barrier | pass | barrier |
| Priya   | pass (slow) | barrier | pass (slow) | barrier | barrier |
| Marcus  | pass | pass | n/a (no confirm) | pass | pass (slow) |
| Sam     | pass | pass (slow) | pass | pass | barrier |
| Ana     | pass | pass | pass | pass | pass (slow) |

Legend: **pass** = task completes with normal effort. **pass (slow)** = completes but with measurable extra time / extra attempts / would likely ask for help if a person were nearby. **barrier** = completes only via workaround or after notable confusion. **blocked** = cannot complete.

---

## Findings by persona

### Jordan — low vision, 200% zoom + VoiceOver, iPhone 13

**T1 Happy path (pass, slow).** Jordan double-taps into "Create a password," VO announces label + the sr-only helper "Your password keeps your account secure." Mobile default `defaultRevealed = true` is helpful — VO doesn't get stuck on `password.password.password`. As Jordan types `MyDog2024!`, the meter appears (`showMeter` flips on focus). The polite live region announces "Length met — 10 or more characters" → "Letter mix met — uppercase and lowercase" → "Number included" → eventually "Password strength: Strong" plus "Your password meets the requirements. You can continue." This is well-paced thanks to F5's 50ms stagger.

Confirm field: VO reads "Confirm your password, secure text field." Jordan re-types. Continue button: `aria-disabled` flips to enabled silently — there is no announcement of the *button state change itself*, only the strength-tier message. **Finding J1 (note):** the gate-passing announcement reads "You can continue" which Jordan hears, but the button's `aria-disabled` flipping false has no separate event — relies on the live region carrying the meaning. This works but couples two ideas into one announcement.

**T2 Backspace recovery (barrier).** Jordan backspaces past the 10-character floor. The live region fires "Length no longer met — need 10 or more characters." Good. But the **length live counter ("3 of 10 characters") is rendered as ordinary text inside the checklist item with no aria-live and no role** — VO will only re-read it if Jordan navigates back to that list item. As Jordan continues typing forward, VO is silent until they cross the 10-character threshold again. For a *sighted* low-vision user at 200% zoom the counter is also problematic: at 200%, the checklist text wraps aggressively and the digit substitution "3 of 10 characters" replaces the rule label "At least 10 characters" — same line, same position, different content. Jordan, scanning, may not register the swap and lose the *rule* context entirely.

  **Severity: important.** Live-counter affordance is silent to SR (already tracked as DD-006, marked "minor") — for Jordan it's not just silent, the dynamic label substitution costs her the rule context too. Suggest keeping the rule label as a constant prefix and adding the counter as a sibling: `At least 10 characters — 3 of 10` (or render counter only when within 3 chars of threshold).

**T3 Mismatch (barrier).** Jordan re-types in confirm with a typo. On blur (because `confirmTouched` is set on blur, not on input), the error appears with `role="alert"` — VO interrupts: "Passwords don't match. Check both fields and try again." But Jordan was already moving toward the Continue button. The alert pulls focus context but not focus itself; Jordan now has to navigate *back up* through VO to find which of the two fields to correct. The error has no link or focus-management hook to the field. At 200% zoom, the two fields are not visible simultaneously — they're vertically separated by the meter + checklist (always visible). Locating the right field again costs real seconds and at least one swipe sequence.

  **Severity: important.** Suggest: on confirm-mismatch, return focus or at least add a programmatic landmark ("Focus is in the confirm field") to the alert text, e.g., "Passwords don't match — check both fields." Already-good copy; the architectural gap is focus management.

**T4 Locked tap (pass).** Jordan with "abc" typed, taps Continue. F2 fires the gate message in the polite live region: "Your password needs to reach Good strength to continue." VO reads it. This works as intended. **F2 is confirmed working for Jordan.**

**T5 All-met-Fair (barrier).** Jordan types "Password1A" (10 chars, mixed case, number → all mandatory met; zxcvbn dictionary attack will mark this as Fair). The bridging hint live region announcement fires once: "Your password meets the rules but is still predictable. Mix in more variety." VO reads it. But — Jordan's actionable next step isn't clear from "mix in more variety." At 200% zoom the visible bridging hint sits between meter and checklist; for sighted-low-vision users it's there. For VO-only users, "mix in more variety" doesn't specify *what kind* of variety. The symbol checklist item is sitting right below ("A symbol makes it stronger") but the relationship between the bridging hint and the bonus symbol rule is implicit. F7's intent — bridge the "checklist done / meter not done" gap — fires correctly, but the copy stops short of saying "add a symbol or extend the password."

  **Severity: important.** Suggest tightening the hint copy to actionable form: "Your password meets the rules but is still predictable. Add a symbol or make it longer."

---

### Priya — Hindi-first English, Pixel 6 in sunlight, reset flow, frustrated

**T1 Happy path (pass, slow).** Reset context shows the blue info box: "Your new password works as soon as you save it." Priya reads it twice — "as soon as you save it" is idiomatic ("as soon as") and her stress level slows her parsing. Once she focuses the field, the meter appears. She types a strong password. Tier labels "Weak / Fair / Good / Strong" — "Fair" is the hardest word here for non-native speakers; ranks below "Weak" colloquially in English (one might assume Fair is *better* than Weak in some contexts, e.g. "fair condition"). **Finding P1 (important):** "Fair" is the only tier label whose ordering is non-obvious to ESL readers. Even though colour and segment count carry it redundantly (P2), the *word* is ambiguous in isolation.

**T2 Backspace recovery (barrier).** Priya backspaces past 10. The visible checklist item flips from filled-check to outline circle via the 280ms `unmet-from-met` animation. For her, the icon transition is fine. But the *text* "At least 10 characters" is replaced by "3 of 10 characters" while she's editing — same problem as Jordan's, different cause: Priya scans the list to figure out *what to do next*, and the rule label disappearing makes her lose her bearings. She has to scroll up to remember what "3 of 10" refers to. In sunlight on the Pixel 6, the muted-text-met state (`text shifts from ink to muted`) is borderline readable: muted grey on white in direct sunlight may dip below perceptual contrast even though it meets WCAG.

  **Severity: important** (same finding as J-T2; double-counted because it surfaces for different reasons).

**T3 Mismatch (pass, slow).** The error "Passwords don't match. Check both fields and try again." is short and direct — Priya understands. Recovery is straightforward because reset context puts both fields close together (no other rules dynamic content between them). Pass, but slowed by the second read of the copy.

**T4 Locked tap (barrier).** Priya types "abc" out of frustration and taps the "Set new password" button. The transient visible gate message appears: "Your password needs to reach Good strength to continue." She reads "reach Good strength" — *"reach"* is figurative English. For a frustrated locked-out user whose first language is Hindi, "needs to reach Good strength" reads as something like "the password is currently below Good strength and must improve." This *is* what's meant — but the sentence structure asks her to parse "reach [tier name] strength" which is unusual phrasing. Closer to plain English: "Your password is not strong enough yet — keep going."

  **Severity: important.** F2 *works* — the message appears, the live region fires — but the copy could land more squarely for ESL users. The current phrasing favours conciseness over plainness.

**T5 All-met-Fair (barrier).** Priya types "Password1A" — all checklist items are ticked. From her vantage as a frustrated user wanting to be done: every rule shows met (visual: ticks + muted text), the meter shows "Fair" in amber. The bridging hint reads: "Your password meets the rules but is still predictable. Mix in more variety." "Predictable" is a medium-complexity English word. "Mix in more variety" is idiomatic. For an ESL reader, this sentence is the densest copy in the whole flow. She does not understand *why* she's not allowed to continue. She has met every visible requirement.

  **Severity: critical.** This is exactly the scenario F7 is supposed to fix and it does technically fire — but the copy uses two ESL-difficult phrases ("predictable," "mix in more variety") at the moment of maximum frustration. Suggest plain-English revision: "Your password is too easy to guess. Add a symbol or make it longer." (Avoids "predictable," gives concrete action.)

---

### Marcus — motor impairment, tablet + stylus + speech-to-text, settings

**T1 Happy path (pass).** Settings context — confirm field is hidden, default-revealed is false (settings = always masked). Marcus uses speech-to-text to dictate the password. Speech-to-text on a masked field is awkward but the toggle is 44px+ (the `pf-toggle` button has implicit padding) and easily stylus-tappable. Toggle colour changed from grey to `#378BDA` per rework — good visibility against white. Once revealed, dictation is easier. Marcus reaches Good. The "Update password" button label is correct via F9.

**T2 Backspace recovery (pass).** Stylus backspace works as normal. Marcus is not rushed.

**T3 Mismatch — n/a (settings context has no confirm field).** Skipped per task spec.

**T4 Locked tap (pass).** Marcus stylus-taps "Update password" while password is too short. The gate message appears. The transient visible message is muted grey 14px (`reg-gate-msg`), which is on the small side at typical tablet viewing distance with low-vision-adjacent visual fatigue from RA medication — but Marcus is fully sighted, so this is acceptable for him. F2 confirmed working.

**T5 All-met-Fair (pass, slow).** Marcus encounters "Password1A," sees the bridging hint, reads it carefully (he's unhurried). The visible hint is positioned correctly in the meter track. He extends the password with a symbol. Works — but the moment exposes that for a settings user (intentional change), there's no orientation as to *why his current password isn't "strong enough"* — he just typed it. He might wonder if his existing password also wouldn't pass the new rules; that's not a question this screen needs to answer, but the bridging hint copy treats him as still-composing rather than reviewing-and-revising.

  **Severity: note.** Settings users might benefit from context-aware bridging copy ("Make it harder to guess — add a symbol or make it longer"), but this is a minor polish.

---

### Sam — ADHD, divided attention, Pixel Fold, scanning

**T1 Happy path (pass).** Sam glances at the screen between checking on the kids. Meter + checklist visible. He types something quickly, sees green ticks accumulating, sees the meter fill into blue. Done. The visual feedback density is high enough that even scanning, he gets the gist. F4 fixes (which appear to be the visible meter + checklist persistence) work well for Sam — he doesn't need to read instructions, the interface *shows* what's needed.

**T2 Backspace recovery (pass, slow).** Sam pastes a password he thinks he'll remember, then realizes it's not strong enough, backspaces a lot to retype. The checklist items revert via the 280ms `unmet-from-met` animation. For a scanner, the reversion *registers* (icon outline reappears, text de-mutes) but the meter colour reverts amber — Sam interpreted amber as "less strong" correctly without reading any text. Good.

**T3 Mismatch (pass).** Sam mistypes confirm in a hurry. The error appears on blur. Sam re-types. Pass.

**T4 Locked tap (pass).** Sam taps Continue while password is "abc" because he's distracted, isn't reading carefully, sees a blue button and assumes it's tappable (it's actually grey/disabled visually — `--color-line` background, `--color-muted` text — but at a quick glance and on a Pixel Fold which may render slightly differently, he tries). Gate message appears, dismisses on next keystroke. Works.

  **Finding S1 (note):** The disabled button visual treatment is light enough (`var(--color-line)` ≈ pale grey background) that distracted users may attempt to tap it. The F2 gate-feedback message rescues this perfectly though — which is exactly what F2 was added to handle. F2 is confirmed working for Sam.

**T5 All-met-Fair (barrier).** This is Sam's worst-case scenario. He types "Password1A," sees three big ticks, the meter shows *some* fill, he assumes he's done, taps Continue. F2 triggers: "Your password needs to reach Good strength to continue." But Sam is scanning, not reading. He sees the bridging hint AND the gate message AND the Continue still disabled-looking. *Two messages saying related-but-different things.* For a non-distracted user these are coherent layers (one explains why the button doesn't fire, one tells you what to add); for Sam they're noise.

  **Severity: important.** The bridging hint + gate message overlap when a Fair-but-all-met user taps Continue. Suggest: if `showBridgingHint` is true and user taps locked Continue, the gate message should *defer* to the bridging hint rather than stack with it. Either suppress the gate message when bridging hint is showing, or merge them.

---

### Ana — baseline, no impairment, iPhone 15 Pro

**T1 Happy path (pass).** Smooth. Floating label lifts, meter appears on focus, checklist visible from page load, types a good password, Continue activates. Less than 30 seconds.

**T2 Backspace recovery (pass).** Backspaces past 10. Sees length item revert. Adds characters. Resumes. Live counter shows during recovery. Pass.

**T3 Mismatch (pass).** Mismatch alert appears on blur of confirm. Re-types. Pass.

**T4 Locked tap (pass).** Taps Continue at "abc," sees the gate message, types more. Pass.

**T5 All-met-Fair (pass, slow).** Ana types "Password1A," sees three ticks, sees meter at Fair (two segments amber), sees the bridging hint, reads it, mentally goes "right, add a symbol," types "!", meter jumps to Good, Continue enables. Works. The slow note is that even for a fluent native English speaker, the bridging hint's "mix in more variety" is a *little* abstract — most users would react with "...like what?" The symbol checklist item below is the next visual element, which serves as the implicit answer, but the line between "predictable" and "add a symbol" is not drawn explicitly.

  **Severity: note.** Even for baseline Ana, F7 *works* but is slightly under-specified in its remediation. The copy assumes the user will look down at the bonus symbol rule.

---

## Cross-persona patterns

### Universal barriers (2+ personas affected)

1. **Bridging hint copy is too abstract (T5).** Affects Priya (critical, ESL), Sam (important, scanner), Jordan (important, no visual anchor), Ana (note). The phrase "mix in more variety" doesn't tell users what to do. F7's *mechanism* is correct (timing, placement, one-time announcement); F7's *copy* is the problem. This is the highest-leverage fix.

2. **Length live counter replaces rather than supplements the rule label (T2).** Affects Jordan and Priya. The substitution "3 of 10 characters" *overwrites* "At least 10 characters" in the same DOM slot. Users who lose attention or who depend on persistent labels lose context.

3. **Gate message + bridging hint can co-occur and overlap (T4 + T5 intersection).** Affects Sam directly; would affect any distracted user who taps Continue while at "all-met-but-Fair." The two messages serve different purposes but visually stack near the same button.

4. **Confirm-mismatch error doesn't shepherd focus (T3).** Affects Jordan critically; affects Priya less (reset context puts fields closer). The `role="alert"` is correct but cold — at 200% zoom, finding the field again is real work.

### Worked surprisingly well

- **F2 (gate feedback) is the cleanest fix in the round.** Every persona who tapped Continue while gated received the message; the polite live region works on VO; the visible muted-text version doesn't alarm. P4 (calm, not punish) is genuinely served. Sam and Ana benefit from the safety net without any cognitive cost.

- **F5 (staggered live region) demonstrably prevents truncation.** Walked through with Jordan's VO inferred behaviour: tier-change at 0ms, rule announcements at 50ms each, submit-threshold at +100ms. No single string exceeds ~75 chars. The structural improvement is real even if it's the kind of thing only happens-to-not-fail-noisily.

- **F9 (context button labels) trivial to verify, lands correctly.** "Continue," "Set new password," "Update password" — Marcus's settings flow shows the right label.

- **Mobile-default-revealed for Jordan + Priya.** Lets VO read the field, lets sunlight-readers (Priya in sun) see what they typed without an extra tap. Subtle but compound win.

### Emotional patterns

- **Frustration peaks at T5 (all-met-Fair) for stressed users (Priya).** The exact scenario F7 was designed for is the one where F7's copy isn't sharp enough.
- **Calm holds throughout for Marcus (settings, unhurried) and Ana (baseline).** No persona reaches alarm; P4 broadly served.
- **Jordan's friction is structural, not emotional.** The interface doesn't *upset* her, it just doesn't extend itself enough at her zoom level + her assistive tech.

---

## Verdict

**Conditional pass — with three required fixes and one recommended.**

### Required before any persona walkthrough is meaningful
- **PRE-1 (critical, blocks all).** Fix the TDZ ReferenceError in `PasswordField.jsx` — move the F7 `useEffect` (lines 352–361) below the `const showBridgingHint = ...` declaration at line 506. One-line move. Without this, no persona can do anything.

### Required for "conditional pass"
- **CP-1 (critical, Priya).** Revise the bridging hint copy to give concrete remediation in plain English. Suggested: `"Your password is too easy to guess. Add a symbol or make it longer."` Replaces "predictable" and "mix in more variety" — both ESL-difficult.
- **CP-2 (important, Sam).** When `showBridgingHint` is true, suppress or merge the F2 gate message on locked-Continue tap. The bridging hint already explains *why* the button is locked; the gate message becomes noise.
- **CP-3 (important, Jordan).** Stop the length live counter from *replacing* the rule label. Render counter as supplemental text adjacent to the rule, not as a substitution.

### Recommended
- **R-1 (important, Jordan).** Confirm-mismatch error: include a focus hint in the copy ("Focus is in the confirm field — passwords don't match") or programmatically return focus to the confirm input after the alert reads. Materially helps 200% zoom + VO users.
- **R-2 (note, all).** Tier label "Fair" is ambiguous in isolation for ESL readers. Consider "Okay" or "Weak / Better / Good / Strong" if you want monotonic positive progression in English. (This is a strategy-level call, not a build-level fix — flag for future iteration.)

### What ships if these are done
After PRE-1 + CP-1, CP-2, CP-3: all five personas complete all applicable tasks with normal effort. F2, F5, F7 (mechanism) confirmed working. F4 (visible meter + checklist persistence) — confirmed working; Sam in particular benefits.

---

# Synthetic User Testing — Re-test, 2026-05-26 (Fix Round 2)

**Build tested:** `src/App.jsx` + `src/components/PasswordField.jsx` post-fix-round-2 (B1–B5 applied), served at http://localhost:5175/
**Method:** Code-and-markup walkthrough of the previously failing persona × task combinations. B1 (TDZ) verified by inspecting line ordering. B2–B5 verified by walking the relevant behaviours as each persona.

## Scope
12 walkthroughs: Jordan, Priya, Sam × T2, T3, T4, T5

Not re-tested: T1 (clean pre-fix for all five personas), Marcus, Ana (clean pre-fix across all applicable tasks; fixes do not touch their paths).

## Re-verification of B1–B5

- **B1 (TDZ ReferenceError) — pass.** `useEffect` is now at `PasswordField.jsx:523`, after `tier` (488), `allMandatoryMet` (500–501), and `showBridgingHint` (502). No const is referenced before its declaration. The component renders. All twelve walkthroughs were actually possible — pre-fix none were.

- **B2 (F7 bridging hint copy) — pass.** `BRIDGING_HINT` at line 82 reads exactly: "Your password is too easy to guess. Make it longer or use different letters and numbers." Single source — used both for the visible `<p>` (line 712) and the live-region announcement (line 526). Both ESL-difficult phrases ("predictable" / "mix in more variety") are gone. Two concrete actions; Grade-4 vocabulary; lands cleanly for Priya at T5 — the most critical pre-fix barrier.

- **B3 (length counter format) — pass.** Line 768 renders `rule.label` unconditionally. Lines 769–773 append a sibling `<span aria-hidden="true">` with `{' · '}{password.length} of 10` only when the length rule is unmet and `password.length > 0`. Counter is aria-hidden — VO does not double-read on list navigation, and the live region already announces length state. Jordan keeps the rule label as a stable anchor; Priya scanning the list sees "At least 10 characters · 3 of 10" without losing the rule context.

- **B4 (F2/F7 stack suppression) — pass.** `PasswordField.jsx:506–508` fires `onBridgingHintChange(showBridgingHint)` on every change. `App.jsx:60–64` stores this as `bridgingHintVisible` and immediately dismisses any in-flight gate message when it becomes true. `App.jsx:71–73` early-returns from `handleSubmit` when `bridgingHintVisible` — no `setShowGateMsg(true)` call. Sam at T5 receives exactly one message (the bridging hint), not two stacked. F2 still fires for short-password locked taps where the bridging hint is not visible (T4 with "abc" — verified Jordan and Sam still get it).

- **B5 (confirm-mismatch focus shepherding) — pass.** `confirmInputRef` is wired to the confirm `<input>` at line 803. `prevConfirmMismatchRef` (line 318) tracks previous state. The useEffect at 513–519 fires `confirmInputRef.current.focus()` only on the false→true transition (`confirmMismatch && !wasError`). Subsequent renders with the error still showing do not re-pull focus — user can Tab away freely. Jordan at 200% zoom no longer has to navigate back up through the DOM to find the confirm field after the alert reads.

## Updated barrier matrix (this scope only)

| Persona | T2 Backspace | T3 Mismatch | T4 Locked tap | T5 All-met-Fair |
|---------|--------------|-------------|---------------|-----------------|
| Jordan  | pass         | pass        | pass          | pass            |
| Priya   | pass         | pass        | pass (slow)   | pass            |
| Sam     | pass         | pass        | pass          | pass            |

Legend unchanged. **pass (slow)** = completes with measurable extra parsing effort; not a barrier.

### Pre-fix → post-fix delta
- Jordan T2: barrier → pass (rule label persistent, counter aria-hidden)
- Jordan T3: barrier → pass (focus shepherding via B5)
- Jordan T4: pass → pass (unchanged; F2 still fires when bridging hint not visible)
- Jordan T5: barrier → pass (B2 copy gives two concrete actions readable via VO)
- Priya T2: barrier → pass (rule label persistent on screen)
- Priya T3: pass (slow) → pass (slightly faster due to B5 focus shepherding, even in reset context)
- Priya T4: barrier → pass (slow) — see note below
- Priya T5: critical barrier → pass (B2 copy lands at Grade-4 plain English)
- Sam T2: pass (slow) → pass (the new format is no worse for scanning)
- Sam T3: pass → pass (faster recovery from B5)
- Sam T4: pass → pass (unchanged)
- Sam T5: barrier → pass (B4 suppresses the stacked gate message; only the bridging hint shows)

### Note on Priya T4
The pre-fix verdict marked Priya T4 as "barrier" specifically because the F2 gate message phrasing ("needs to **reach** Good strength") is figurative English. The Fix Round 2 list (B1–B5) did not include a revision of this gate-message copy — it was tracked as second-order friction behind the more critical T5 bridging-hint copy. The copy at `App.jsx:106` and `App.jsx:112` is unchanged. Priya still parses it with effort but the gate message no longer competes with a stacked bridging hint (B4) and her T5 frustration entrypoint is gone, so the overall T4 experience for her is materially better than pre-fix. Promoting from "barrier" to "pass (slow)": the task completes, the phrasing remains slightly figurative. Not a regression. Suggested future copy pass: replace "needs to reach Good strength to continue" with a plainer construction ("is not strong enough yet — keep going" or similar).

## New issues introduced

None observed.

- **App.jsx lifted state (`bridgingHintVisible`)** is additive — does not change any pre-existing path. `handleChange` and `handleBack` are untouched. `handleSubmit` short-circuits before any new side effects when the new condition is true; otherwise behaves identically to before.
- **`onBridgingHintChange` prop** is optional (`if (onBridgingHintChange)` guard at PasswordField line 507). The component remains drop-in for any consumer that doesn't pass the callback.
- **B3 DOM change** adds at most one sibling `<span>` to the length list item. No layout shift. No effect on the live region (counter is `aria-hidden`).
- **B5 focus shepherding** does not trap focus and does not fire on mount (refs initialise to false; only false→true transitions trigger the focus call). No double-fire risk with the `role="alert"` div — the alert reads, focus lands; both happen in the same render with a tolerable ordering for VO and JAWS.
- **B1 useEffect relocation** is a pure motion of the same effect with the same dependencies; the pre-fix behaviour was "crash on every render," so there is no prior runtime semantics to regress.

## Final verdict

**Pass — all twelve walkthroughs clean; B1–B5 resolved.**

Every persona × task combination in scope completes with normal effort. Priya T4 is "pass (slow)" rather than fully crisp because the F2 gate message copy uses "reach Good strength" — figurative English not on the B-list. Not a regression, not a blocker, and recommended for a future copy pass rather than a fix-round 3.

The other three previously-failing Priya barriers, Jordan's three previously-failing barriers, and Sam's stacked-messages barrier are all resolved. F2, F5, F7 (mechanism + copy), B3 counter format, B4 stack suppression, and B5 focus shepherding all confirmed working from the relevant personas' vantage points.

Ready for verification-before-shipping.
