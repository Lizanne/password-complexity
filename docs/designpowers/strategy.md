# Design Strategy — Password Complexity
**Date:** 2026-05-26
**Author:** design-strategist
**Status:** Draft — pending check-in answer on checklist collapse behaviour

---

## 1. Design Principles

### P1: Teach as they type, never punish at submit
**What it means in practice:** Every rule is visible from the moment the field receives focus. Strength feedback updates with each keystroke (debounced — see Section 4). If the user submits a form with an insufficient password, that state should be impossible — the submit action is unavailable until "Good" or "Strong" is reached, not blocked after the fact with an error toast.

**What it rules out:** No post-submit "password too weak" errors. No validation summary that lists password failures alongside other field errors. No hiding the rules until the user types something.

**How to test it:** Ask a user to complete the password field. If at any point they encounter a message that tells them their password is wrong after they tried to proceed, P1 has failed.

---

### P2: The same verdict through every channel
**What it means in practice:** The strength tier (Weak / Fair / Good / Strong) is communicated via colour, text label, icon/shape, and a screen-reader live region — simultaneously. A user who sees no colour, hears a screen reader, or has reduced motion gets the same information as a sighted, mouse-and-keyboard user. The checklist rule states (met / unmet) are announced in the same live region, not just visually.

**What it rules out:** Strength communicated through colour alone. Meter ticks or fills that are purely decorative with no text equivalent. Announcements that rely on hover or on focus-loss.

**How to test it:** Test the complete flow with VoiceOver on iOS and TalkBack on Android. The user should hear: current strength tier + which rules have changed state, without the announcements interrupting the act of typing. Also test in Windows High Contrast mode — the meter must still read correctly.

---

### P3: Show only what matters for the current task, then get out of the way
**What it means in practice:** The checklist shows unmet rules prominently. Rules that are already satisfied move to a quieter state (still visible, but reduced weight) so the eye goes to what still needs fixing. Once all rules are met, the checklist earns the right to collapse — the field is resolved, do not keep the scaffolding on screen.

**What it rules out:** Keeping the full checklist at full visual weight after all rules are satisfied. Showing the meter and checklist before the user has focused the field (pre-interaction feedback is noise). Showing strength at the page level rather than attached to the input.

**How to test it:** Show the completed component (all rules met, Strong tier) to a user and ask "what do you still need to do?" The answer should be "nothing" — the UI should be visually quiet and not imply remaining work.

---

### P4: Calm the anxious user, don't alarm them
**What it means in practice:** This component lives in three contexts, two of which carry negative emotional load (registration: pressure to finish quickly; reset: already locked out, frustrated). The copy and visual language should be encouraging without being patronising. Reaching "Good" should feel like a small win. "Weak" should feel informative, not accusatory. Use second-person present tense: "Includes a number" not "Must include a number."

**What it rules out:** Red error styling on the meter at "Weak" (use amber/neutral, not red — red reads as "you've done something wrong," not "here's what to add"). Copy that uses words like "invalid," "failed," or "rejected." Any micro-animation that feels urgent or alarming.

**How to test it:** Show the "Weak" state to someone unfamiliar with the component. Ask how it makes them feel. If they say stressed, embarrassed, or confused, P4 has failed.

---

### P5: One component, context-aware — never three separate implementations
**What it means in practice:** The password component is a single unit. Context (registration / reset / settings) is passed as a prop and affects copy only — the heading, the helper text, and the CTA label change. The rules, meter logic, scoring, and accessibility behaviour are identical across all three contexts. This prevents the three implementations from drifting out of sync over time.

**What it rules out:** Writing three separate components. Having different rule thresholds for different contexts. Diverging interaction behaviour between registration and reset.

**How to test it:** Change the context prop from `registration` to `reset`. The only visible change should be the text strings. No layout change, no logic change, no rule change.

---

## 2. Password Rules Specification

### 2.1 Mandatory rules (hard enforcement)

**[USER OVERRIDE — PRD US-5 2026-05-26]** Rule set changed: 3 mandatory rules → 5 mandatory rules. Length threshold 10 → 8. caseMix split into uppercase + lowercase. Symbol promoted from recommended to mandatory. See Section 2.2 for the symbol override rationale.

| Rule | Threshold | Rationale |
|------|-----------|-----------|
| Minimum length | ~~**10 characters**~~ **8 characters** *(PRD US-5 override)* | NIST SP 800-63B recommends 8 as floor; changed from 10 to align with NIST minimum |
| Maximum length | **128 characters** | Allows passphrases; prevents hash-size DoS. Do not truncate silently — reject above 128 with an informative message |
| At least one uppercase letter | Yes | Named explicitly in checklist |
| At least one lowercase letter | Yes | Named explicitly in checklist |
| At least one number | Yes | Named explicitly |
| At least one special character | **Yes — mandatory** *(PRD US-5 override — was recommended)* | See §2.2 override note |

### 2.2 Recommended rules (influence score, not hard-blocked)

**[USER OVERRIDE — PRD US-5 2026-05-26]** Symbol rule moved from this section to §2.1 (mandatory). The original rationale ("Mandatory symbols on mobile = friction") is superseded by the PRD US-5 decision. Blacklist check is now a NEW client-side feature (not just invisible enforcement — see §2.2a below).

| Rule | How it's surfaced | Rationale |
|------|-------------------|-----------|
| ~~At least one symbol~~ | ~~Checklist item marked "adds strength," not required~~ | **MOVED TO MANDATORY — PRD US-5** |
| Not a common password (blocklist) | **NEW: explicit client-side check** *(PRD US-5 override — no longer purely invisible)* | See §2.2a |
| No keyboard sequences (qwerty, 12345) | Invisible enforcement via zxcvbn | Same reasoning |
| No repeated characters (aaaa, 1111) | Invisible enforcement via zxcvbn | Same |

#### §2.2a Blacklist check — new client-side feature (PRD US-5)

**Note (2026-05-26): The blacklist check is currently inactive, gated behind `FEATURES.BLACKLIST_CHECK` in `src/config/features.js` (default `false`). The implementation is fully preserved — see `src/lib/passwordCheck.js` for the API contract and mock. Set the flag to `true` to re-enable all blacklist behaviour described below.**

The blacklist check is an explicit client-side UX signal. Implementation:
- Stubbed as `src/lib/passwordCheck.js` with ~30 common passwords (replaces earlier `src/lib/blacklist.js`)
- Checks fire on blur (not debounced on typing) — one call, one verdict
- States: `idle | checking | accepted | rejected | timeout`
- Rejection surfaces an inline notice: "Not accepted / This password is too common — please choose another."
- Timeout (>3000ms): treats as `accepted` — server is authoritative gate; do not block on client timeout
- Production: replace stub with real API call; server-side enforcement remains mandatory

### 2.3 Personal info reuse
**Out of scope for component-level enforcement.** The component has no access to other registration fields. Personal info reuse checks (e.g., name, email, date of birth in password) belong in API-level validation, not in the client component. If API returns a rejection reason on submit, the component must surface it, but the check itself is not the component's responsibility.

### 2.4 Checklist items — final list (visible to user)

**[USER OVERRIDE — PRD US-5 2026-05-26]** Five items, all mandatory. caseMix split. Symbol required.

Five items, all in plain language:

1. At least 8 characters *(threshold changed: 10 → 8)*
2. Uppercase letter *(split from caseMix)*
3. Lowercase letter *(split from caseMix)*
4. At least one number
5. Special character *(promoted from recommended to required)*

~~Item 4 is styled distinctly (bonus `+` icon, muted text, no checkmark).~~ All items now use the circle-outline / circle-check icon pattern. No bonus framing.

### 2.5 Strength scoring — **[SUPERSEDED — two-state meter rewrite 2026-05-26]**

~~**Recommendation: yes, use zxcvbn (or a maintained fork such as `zxcvbn-ts`).**~~

**SUPERSEDED 2026-05-26:** zxcvbn-ts has been removed from the project. Strength is now determined purely by rule evaluation (5 rules, all mandatory). The two-state model replaces the four-tier model. See §2.6 below.

**New scoring model:** `rulesMet` (0–5) → `segmentsLit` (0–3) bucket → `isStrong` (boolean, all 5 rules met). No third-party library involved.

~~Reasons for zxcvbn:~~
~~- It measures actual entropy, not rule-counting.~~
~~- It handles dictionary words, keyboard patterns, dates, and names without requiring a custom blocklist.~~
~~- The 0–4 output maps directly to the four-tier system below.~~
~~- The library is ~800KB — acceptable for a registration flow.~~

**Note on §2.2a:** Blacklist check (`passwordCheck.js`) remains the defence against common passwords. zxcvbn's dictionary/pattern matching is no longer active — the blacklist check is the only common-password guard on the client side.

### 2.6 Strength tiers — **[SUPERSEDED — two-state rewrite 2026-05-26]**

~~| Score (zxcvbn) | Tier label | Colour signal | Icon signal |~~
~~|----------------|------------|---------------|-------------|~~
~~| 0 | Weak | Amber (`#B8894A`) | Single segment filled |~~
~~| 1 | Fair | Amber | Two segments filled |~~
~~| 2 | Good | Blue (`#378BDA`) | Three segments filled |~~
~~| 3–4 | Strong | Blue (deeper) | Four segments filled |~~

**SUPERSEDED 2026-05-26 — new two-state model:**

| Rules met | Segments lit | Colour | Label |
|-----------|-------------|--------|-------|
| 0 | 0 of 3 | track only (#929292) | (none — pre-typing or no rules met) |
| 1–2 | 1 of 3 | grey progress (#3f3f3f) | Weak |
| 3–4 | 2 of 3 | grey progress (#3f3f3f) | Weak |
| 5 (all) | 3 of 3 | green (#1E7A3A) | Strong |

**Why two states instead of four?** The new spec drops the amber/middle states. Grey progress signals "you're making progress" without attaching a named tier to every increment. The state change to green and "Strong" is a clear, distinct completion signal. This matches P4 (calm, not alarming) and removes the "Fair" / "Good" intermediate names that added cognitive load without guiding action.

~~**Why amber, not red, for Weak/Fair?**~~ Grey instead of amber: spectrum now goes grey-progress → green-strong. No amber anywhere.

~~**Why only four tiers?**~~ Three segments map to the two-state model: 0 filled / progress / all-filled (strong).

**Form submission gate:** ~~The form proceed/submit action is enabled only at "Good" (score 2) or above.~~ **[USER OVERRIDE — PRD US-5 2026-05-26]** Submission is no longer gated by tier. The meter is purely informational. The gate is: all 5 mandatory rules met AND blacklist not rejected. The six-path Next button logic enforces this. The field-level error slot (not a modal, not a toast) provides feedback when the gate conditions are not met. P1 is still enforced — the button always responds with guidance instead of silently failing.

---

## 3. Three-Context Strategy

**Decision: one component with a context prop. Not three components.**

This implements P5 directly. The component accepts a `context` prop: `'registration' | 'reset' | 'settings'`.

### What changes between contexts

| Element | Registration | Reset | Settings |
|---------|-------------|-------|----------|
| Field label | "Create a password" | "New password" | "New password" |
| Helper text (above field) | "Your password keeps your account secure." | "Create a new password for your account." | "Update your account password." |
| Strength label prefix | None — meter speaks for itself | None | None |
| Confirm password field | Yes — required | Yes — required | Yes — required |
| Current password field | No | No | Yes — required before new password |
| Form CTA | Controlled by registration flow (not this component) | "Set new password" | "Update password" |
| Error copy (API reject) | "Something went wrong. Try a different password." | "Something went wrong. Try a different password." | "Something went wrong. Try a different password." |

### What does not change between contexts

- Password rules (same 4 items)
- Meter tiers and scoring logic
- Checklist behaviour
- Feedback timing
- Accessibility behaviour
- Show/hide toggle
- Submit gate threshold (Good or above)

### Reset context: specific considerations
The reset context is the highest emotional-load scenario. The user is locked out, possibly on mobile, possibly using a link from email with a time limit. Two additions specific to this context:
- Helper text should acknowledge the context without dwelling on it: "Create a new password for your account." Not "You've been locked out." Not "For security reasons, your password was reset." Neutral and forward-facing.
- If the reset token has expired, that error surfaces at the page level, not in the component. The component is not responsible for token validity.

### Settings context: specific considerations
The settings context is the only one where the user must first enter their current password. This is a separate field above the new password field — it is not part of the password-complexity component's scope. The component assumes the current-password check is handled by the surrounding form. The component is handed focus only after current-password is confirmed (progressive reveal) or can be placed beneath current-password in the form flow.

---

## 4. Experience Principles for Meter and Checklist

### 4.1 When does feedback appear?

**On focus + first keystroke, debounced at 300ms.**

- The checklist appears when the field receives focus — before typing begins. This sets expectations and shows the user what they're working toward (P3: show what matters for the task, not after the fact).
- The meter and checklist state update as the user types, debounced at 300ms. This prevents the meter from flickering on every character, which is visually distracting and cognitively noisy, especially for slow typists.
- 300ms is the sweet spot: fast enough to feel live, slow enough not to feel anxious.

**What fires immediately (no debounce):** The show/hide toggle. Toggling password visibility must be instant — debouncing it would feel broken.

### 4.2 Does the meter go backwards?

**Yes, and that is correct behaviour.**

If a user pastes a password, sees "Strong," then edits it, the meter must reflect the current state of the field. Preventing the meter from going backwards would mean showing "Strong" for a password that is no longer strong — a direct violation of P2 (same verdict through every channel) and P1 (never deceive).

The visual transition should be smooth (ease-in-out, ~200ms) so going from three segments to two doesn't feel like a punishing animation — it feels like an accurate readout.

### 4.3 Where does the checklist live?

**Always visible from focus; collapses when all rules are met and the field loses focus.**

Behaviour in full:
1. Field not focused, no value: checklist hidden (clean pre-interaction state)
2. Field focused (any value, including empty): checklist visible
3. All rules met + field focused: checklist transitions to a "complete" quiet state — items remain visible but at reduced opacity, with a single "All requirements met" summary label appearing above them. Meter shows "Good" or "Strong."
4. All rules met + field loses focus: checklist collapses with a short ease-out transition (~200ms). The field label area shows a small inline "Strong" or "Good" badge to confirm state without the full checklist.
5. User returns focus: checklist re-expands. If they've deleted characters and broken a rule, the relevant item is immediately visible again.

**Note:** This is the recommended approach. The open question (collapse vs stay-visible) has a clear lean here — collapse on blur after completion. The reasoning: for a mobile-first form, screen real estate is the premium. Collapsing a resolved section clears space for what's next. The "re-expand on focus" behaviour handles the recovery case without requiring the section to stay permanently open.

### 4.4 Relationship between meter colour and rule completion

**The meter tier cannot exceed "Fair" while any mandatory rule is unmet. Period.**

Specifically:
- Checklist has 3 mandatory rules (length, case mix, number). Symbol is recommended, not required.
- zxcvbn may assign a high entropy score to a password that doesn't meet the named rules (e.g., a long all-lowercase passphrase). In that case, the meter display is capped at "Fair" regardless of the zxcvbn score.
- The effective display score = min(zxcvbn_score, max_tier_for_rules_met)
- When all 3 mandatory rules are met, the zxcvbn score governs fully. Adding a symbol then pushes the score further.
- This means the user cannot see "Good" or "Strong" while a mandatory rule is unlit in the checklist. The meter and checklist always agree.

This is a non-negotiable relationship. Letting the meter show "Strong" with unmet checklist items would be deceptive and would break the submit gate (which is tied to the displayed tier, not just the raw score).

---

## 5. Persona Ability-Spectrum Notes

The brief lists five ability-spectrum considerations. Below, each is sharpened into specific design implications.

### 5.1 Screen reader users

**Implication: two live regions, one polite, one for recovery only.**

- The strength tier label (Weak / Fair / Good / Strong) sits in an `aria-live="polite"` region. It announces after the debounce resolves, not on every keystroke — so the user hears "Fair" after a 300ms pause, not character-by-character noise.
- Individual rule completions also announce in the same polite live region. Announcement format: "[Rule name] — met" or "[Rule name] — not yet met." Example: "At least 10 characters — met."
- Do not use `aria-live="assertive"` for any password feedback. Assertive interrupts whatever the screen reader is currently saying — it is appropriate for genuine errors (session expired, network failure), not for progressive guidance while typing.
- The checklist items should use `role="status"` or be wrapped in the polite live region so the user does not have to navigate away from the field to hear rule states.
- The show/hide toggle must have a programmatic label that changes: `aria-label="Show password"` / `aria-label="Hide password"`. The icon alone is not sufficient.
- When the checklist collapses (all rules met, blur), announce once: "All password requirements met." Do not announce the collapse itself.

### 5.2 Low vision / colour blindness

**Implication: the meter must encode strength in at minimum three dimensions, never colour alone.**

- Dimension 1 — colour (amber / blue / deeper blue): serves sighted users
- Dimension 2 — segment count (1–4 segments filled): encodes tier without colour dependence
- Dimension 3 — text label ("Weak" / "Fair" / "Good" / "Strong") adjacent to the meter: readable in monochrome, high-contrast, and forced-colours mode
- The amber and blue tokens from the platform do not conflict for the most common forms of colour blindness (deuteranopia, protanopia), but the shape/count dimension makes colour entirely optional.
- In Windows High Contrast mode, segment fills must use `currentColor` or a forced-colours-aware approach so segments are distinguishable from their container.
- Checklist icons: do not use only a red X and a green tick. Use a neutral unchecked circle (not X) for unmet rules and a filled check for met rules. The distinction is shape, not only colour.

### 5.3 Motor / touch users

**Implication: the show/hide toggle is a first-class interactive element with a minimum 44×44px target.**

- The toggle lives inside the input field boundary (right-aligned). It must not reduce the effective touch target of the input itself.
- Touch target implementation: the visible icon can be smaller (20–24px) but the interactive area must be padded to 44×44px minimum, implemented via padding or a pseudo-element, not by enlarging the visible icon.
- No hover-only affordances anywhere on the component. The toggle is visible at all times when the field is populated, not only on hover.
- The checklist rows are not interactive (they are informational) — no accidental tap targets on list items.
- If the form has a "confirm password" field, the show/hide toggle on the primary field should optionally reveal both fields simultaneously (a single toggle action that reveals both) — otherwise the user has to tap twice on a mobile keyboard layout where the confirm field may be scrolled out of view.

### 5.4 Cognitive load

**Implication: four rules maximum, plain verbs, no jargon, no conditional logic in copy.**

- Four checklist items maximum. No rule that requires the user to understand what "alphanumeric" means.
- Rule copy uses present-tense description of state, not a command: "Includes a number" (state they're aiming for) or "At least one number" (direct requirement). Avoid "Must contain at least one digit" — "digit" is jargon, "must" is commanding.
- Do not add explanatory footnotes to rules. If a rule needs a footnote to explain it, rewrite the rule.
- The meter label and checklist items use consistent verbs across all states. Don't say "Add a symbol" in one place and "Contains symbol" in another — pick one pattern and hold it.
- Progressive disclosure: the checklist starts with unmet rules most prominent. As rules are met, they quiet down (visual weight reduces) — the user's attention is always pulled toward what remains, not what's done.
- Error copy (API reject on submit) should be a single sentence, plain, and forward-pointing: "Try a different password." Not "Your password does not meet our security requirements." Users don't need to know why the API rejected it; they need to know what to do.

### 5.5 Non-native English speakers

**Implication: short words, consistent verbs, no idioms, no culturally specific humour.**

- Rule copy vocabulary: use only words from a plain-English tier-1 vocabulary. "Letter," "number," "symbol" are fine. "Uppercase," "lowercase" are fine (universal computing vocabulary at this point). "Alphanumeric," "special character," "digit" are not fine.
- Tone copy ("calm confidence with warmth") must not rely on idiom or cultural shorthand. Avoid phrases like "You're all set!" or "Almost there!" — they are friendly but carry different weight for non-native readers and can feel misleading.
- Checklist items should have consistent grammatical structure: all start with the same pattern. Either all start with a noun phrase ("At least 10 characters," "A number," "A symbol") or all start with a verb ("Has 10 or more characters," "Includes a number"). Don't mix structures.
- The strength tier labels (Weak / Fair / Good / Strong) are common English adjectives — these are appropriate. Avoid creative alternatives like "Meh" or "Solid" which are colloquial and translate poorly.

---

## Open Question (Pending)

**Checklist collapse behaviour:** When all mandatory rules are satisfied, should the checklist collapse on blur (recommended above) or remain visible until the field is cleared? Answer will confirm or revise Section 4.3.
