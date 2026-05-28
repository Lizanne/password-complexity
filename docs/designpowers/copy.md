# Interface Copy — Password Complexity
**Agent:** content-writer
**Date:** 2026-05-26
**Status:** Complete — ready for implementation
**Reading level target:** Grade 6–8 (Flesch-Kincaid)
**Actual reading level:** Grade 4–6 (verified against drafts below)

---

## How to read this document

Every string is final and ready to implement verbatim. Where a string varies by context, the context is labelled (`registration` / `reset` / `settings`). Dynamic values are shown in `{curly braces}`. Screen-reader-only strings are labelled `[sr-only]`.

---

## 1. Field Labels

### 1.1 Password field label

| Context | Label string |
|---------|-------------|
| `registration` | `Create a password` |
| `reset` | `New password` |
| `settings` | `New password` |

No colon after any label. Labels are not instructions — they name the field.

### 1.2 Helper text (below the field label, above the field)

These sit between the label and the input. They are short, present-tense, and do not repeat what the checklist already shows.

| Context | Helper text string |
|---------|-------------------|
| `registration` | `Your password keeps your account secure.` |
| `reset` | `Create a new password for your account.` |
| `settings` | `Update your account password.` |

**Note:** In `reset`, the helper text sits above the info box. The info box copy is separate — see Section 1.4.

### 1.3 Confirm password field label

**[DEPRECATED — User override 2026-05-26]** The confirm password field has been removed across all contexts. These strings are no longer rendered. Retained here in case the design direction reverses.

| Context | Label string |
|---------|-------------|
| `registration` | `Confirm your password` |
| `reset` | `Confirm your new password` |
| `settings` | `Confirm your new password` |

No helper text below the confirm field. The field is self-explanatory; adding help text creates noise.

### 1.4 Reset context: blue info box

This element appears only in `context="reset"`. It sits between the helper text and the input field. Background: `--color-accent-soft` (`#E8F0FA`). Max ~60 characters.

**String:**
> `Your new password works as soon as you save it.`

Character count: 47. Fits the 60-character slot with room.

**Rationale:** The locked-out user's core anxiety is "will this actually work?" This line answers that directly without dwelling on why they are in the reset flow. No idiom. No false positivity. Plain present tense.

---

## 2. Show / Hide Toggle

**[Updated — User override 2026-05-26]** The confirm field has been removed. The toggle now controls only the one password field.

~~One toggle controls both the password field and the confirm field simultaneously.~~

### 2.1 Visible state (password characters shown)

- **Icon:** Eye-slash (masked view icon)
- **`aria-label`:** `Hide password`

### 2.2 Hidden state (password characters masked, dots/bullets shown)

- **Icon:** Eye (open view icon)
- **`aria-label`:** `Show password`

**Screen reader narration note:** The `aria-label` changes programmatically when the state changes. A screen reader user toggling the button will hear the updated label on the button — they do not need a separate live region announcement for this action.

**Note:** The `aria-label` says "password" (singular) — this is now the correct and only field. The single-word label convention stands regardless of the confirm field removal.

---

## 3. Strength Labels — Two-State Model

**[REWRITTEN — Two-state meter 2026-05-26]** The four-tier system (Weak/Fair/Good/Strong) has been superseded. Only two states now exist: `Weak` (0–4 rules met) and `Strong` (all 5 rules met).

### 3.1 Active labels

| State | Label | Condition |
|-------|-------|-----------|
| `Weak` | `Weak` | 1–4 rules met (post-typing) |
| `Strong` | `Strong` | All 5 rules met |

Label is absent before first keystroke (pre-typing state — no premature "Weak").

**`aria-description` strings (sr-only, attached to meter via `aria-describedby`):**
- Weak: `Your password is easy to guess. Keep going — the checklist below shows what to add.`
- Strong: `Your password is very hard to guess. You're ready to go.`

### 3.2 Deprecated (four-tier — superseded 2026-05-26)

The following labels and aria-descriptions are **deprecated** as of the two-state rewrite. They are retained here for audit history only. Do not implement.

| Tier | Label | `aria-description` |
|------|-------|--------------------|
| ~~Fair~~ | ~~`Fair`~~ | ~~`Your password is getting stronger. Check the list below to see what's left.`~~ |
| ~~Good~~ | ~~`Good`~~ | ~~`Your password is strong enough to use. Adding a symbol makes it even stronger.`~~ |

**Rationale for deprecation:** The two-state meter spec prose explicitly drops the amber/middle-tier system. Fair and Good states no longer exist in the interaction model — the meter goes from Weak (grey progress) to Strong (green) with no intermediate named state.

---

## 4. Checklist Rule Copy

**[USER OVERRIDE — PRD US-5 2026-05-26]** Rule set expanded from 4 to 5 rules. All rules are now mandatory. caseMix split into two rules. Symbol rule promoted from bonus to required. Length threshold changed from 10 to 8.

**[FIGMA UPDATE — 2026-05-26]** Rule copy updated to "One X" convention (all four non-length rules now use "One" prefix). Rule order changed: length → lowercase → special → uppercase → number (matches Figma empty-state design).

### Grammatical pattern

All five items follow the same noun-phrase pattern:

> `[Quantity or article] + [noun]` + optional descriptor

This pattern is consistent, scannable, and works for non-native English speakers.

---

### 4.1 Length rule (8+ characters) — **[UPDATED: threshold 10 → 8]**

**Unmet:**
> `At least 8 characters`

**Met (same string, quieted visually):**
> `At least 8 characters`

**Live counter affordance (updated threshold):**

> `· {n} of 8`

Examples: `· 3 of 8`, `· 7 of 8`

**Implementation note:** Counter appends to the rule label as `"At least 8 characters · 3 of 8"`.

**Screen reader note:** The counter updates via the live region, not by making the checklist item itself live. Do not put `aria-live` directly on the checklist item.

---

### 4.2 Case mix rule (uppercase + lowercase)

**Unmet:**
> `Uppercase and lowercase letters`

**Met (same string, quieted visually):**
> `Uppercase and lowercase letters`

**Rationale:** "Uppercase and lowercase" is computing vocabulary that is universally understood, including by non-native English speakers, and avoids jargon like "mixed case" or "case-sensitive". The word "letters" at the end clarifies we are talking about alphabetic characters, not the rule itself. No verb, no command — describes what the password should contain.

---

### 4.3 Number rule — **[copy updated Figma 2026-05-26: "At least one number" → "One number"]**

**Unmet:**
> `One number`

**Met (same string, quieted visually):**
> `One number`

---

### 4.4 Special character rule — **[UPDATED — PRD US-5: promoted from bonus to required; copy updated Figma 2026-05-26]**

**[USER OVERRIDE 2026-05-26]** Symbol rule is now mandatory. `+` icon and bonus framing removed. Uses circle-outline / circle-check icons like all other rules. Copy updated to "One X" convention per Figma 2026-05-26.

**Unmet:**
> `One special character`

**Met (same string, quieted visually):**
> `One special character`

**Note:** Previous copy "Special character" (PRD US-5) updated to "One special character" per Figma 2026-05-26. Follows the "One X" pattern used by all four non-length rules.

---

### 4.5 Uppercase letter rule — **[NEW — PRD US-5: split from caseMix; copy updated Figma 2026-05-26]**

**Unmet:**
> `One uppercase letter`

**Met (same string, quieted visually):**
> `One uppercase letter`

---

### 4.6 Lowercase letter rule — **[NEW — PRD US-5: split from caseMix; copy updated Figma 2026-05-26]**

**Unmet:**
> `One lowercase letter`

**Met (same string, quieted visually):**
> `One lowercase letter`

---

### 4.7 Hint messages — **[SUPERSEDED — brief 2026-05-26]**

**[SUPERSEDED]** These single-string Next-tap hints are replaced by the count-based submit message system (§11.1). The strings below are no longer rendered. Retained for audit history.

~~Shown in the field-level error slot when Next is tapped and the named rule is the first unmet rule.~~

| Trigger | ~~Hint string~~ |
|---------|------------|
| ~~Empty field~~ | ~~`Enter a password to continue.`~~ |
| ~~Length < 8~~ | ~~`Make it at least 8 characters to continue.`~~ |
| ~~No uppercase~~ | ~~`Add an uppercase letter to continue.`~~ |
| ~~No lowercase~~ | ~~`Add a lowercase letter to continue.`~~ |
| ~~No number~~ | ~~`Add a number to continue.`~~ |
| ~~No special char~~ | ~~`Add a special character to continue.`~~ |

**Superseded by:** §11.1 Submit messages (count-based, 15 strings, blur-driven). The new system covers the same cases with more precision and is owned by PasswordField.jsx, not App.jsx.

---

### 4.8 Inline rejection notice — **[UPDATED — 2026-05-26: two-tier structure]** **[INACTIVE — flag-gated, see FEATURES.BLACKLIST_CHECK]**

Shown below the meter row, above the checklist, when the blacklist check returns `rejected`. Two-tier treatment: a prominent status label plus supporting text below.

**Status label (primary read):**
> `Not accepted`

14px, weight 600, amber-brown (`--color-field-error`). Sits on the same line as the warning triangle icon.

**Supporting text (secondary read):**
> `This password is too common — please choose another.`

13px, weight 400, softer amber-brown (65% opacity of `--color-field-error`). Indented to align with the status label (not under the icon).

**Screen reader announcement:** Both parts are inside the same `aria-live="polite"` region. The screen reader reads them in DOM order: *"Not accepted. This password is too common — please choose another."*

**Note:** "rejected" is a vocabulary-banned word per §9.2 but it is the internal state name — the user-facing copy says "Not accepted" / "too common" which are plain and direct. "Please choose another" is the action.

---

### 4.9 Button mode labels — **[NEW — PRD US-5] [CONFIRMED — on-blur slice 2026-05-26]**

| Mode | Label | Status |
|------|-------|--------|
| Idle (registration) | `Next` | Active |
| Checking | `Checking…` | **[INACTIVE — flag-gated, see FEATURES.BLACKLIST_CHECK]** |
| Submitting | `Creating account…` | Active |
| Success heading | `Account created` | Active |
| Reset link | `Start over` | Active |

**Note:** `Checking…` is the label while the on-blur blacklist check is in flight (300ms mock). The button remains visually at its idle treatment during this state — spinner is the only added element. "Checking…" is verbatim; do not alter capitalisation or punctuation. This label is currently inactive (see flag status above).

---

## 5. Screen-Reader Live Region Copy

**[UPDATED — PRD US-5]** Rule ids changed (uppercase, lowercase, special replace caseMix, symbol).

All announcements go in a single `aria-live="polite"` region. These strings are read in full each time the region updates.

### 5.1 Strength state change announcements — **[UPDATED — two-state rewrite 2026-05-26]**

**Active (two-state model):**

| Transition | Announcement string |
|------------|---------------------|
| → Strong (all 5 rules met) | `Password strength: Strong` |
| ← Weak (regression from Strong) | `Password strength: Weak` |

**Announce only on state transition (Weak → Strong or Strong → Weak). Do not re-announce on every keystroke within the same state.**

Implementation: gate the live region update on `prevIsStrong !== isStrong`. When 4 rules met on one keystroke and still 4 rules met on next keystroke, no announcement fires.

**Deprecated (four-tier — superseded 2026-05-26):**
- ~~`Password strength: Fair`~~
- ~~`Password strength: Good`~~

### 5.2 Rule met announcements — **[UPDATED — PRD US-5]**

| Rule | Announcement string |
|------|---------------------|
| Length (8+ chars) | `Length met — 8 or more characters` |
| Uppercase | `Uppercase letter added` |
| Lowercase | `Lowercase letter added` |
| Number | `Number included` |
| Special character | `Special character added` |

### 5.3 Rule broken (regression) — **[UPDATED — PRD US-5]**

| Rule | Announcement string |
|------|---------------------|
| Length dropped below 8 | `Length no longer met — need 8 or more characters` |
| Uppercase lost | `Uppercase letter no longer included` |
| Lowercase lost | `Lowercase letter no longer included` |
| Number removed | `Number no longer included` |
| Special char removed | `Special character removed` |

### 5.4 Field is strong enough to submit — **[UPDATED — two-state rewrite 2026-05-26]**

Announce once when the password crosses from Weak → Strong (all 5 rules met — the submit threshold):

> `Your password meets the requirements. You can continue.`

**Notes:**
- Announce only on the Weak → Strong transition (all 5 rules now met)
- Fires after the `Password strength: Strong` announcement with a 100ms stagger
- "You can continue" is more direct than "You're ready to proceed" — two fewer words, same meaning
- Do not announce "Submit is now enabled" — refers to UI state, not user state

~~Prior trigger: Fair → Good transition (was the submit gate). Now superseded — submit gate is all-5-rules-met.~~

---

## 6. Error States

These are true server-side errors. The component surfaces them in the error slot below the field (see visual-decisions.md Section 7). Each is one sentence, maximum ~80 characters.

### 6.1 Generic submit failure

**Where it appears:** Below the password field, in all three contexts, when the server returns an unexpected error.

**String:**
> `Something went wrong. Try a different password.`

Character count: 47. Fits the 80-character slot.

**Note:** Design-lead's placeholder and the strategy's suggested copy both land here. This string is correct — validated, not just accepted.

### 6.2 Recent password reuse (`reset` and `settings` contexts only)

**Where it appears:** Below the password field in `reset` or `settings` context when the API returns a reuse rejection.

**String:**
> `This is the same as a recent password. Try a new one.`

Character count: 53.

**Rationale:** "Recent password" not "previous password" or "old password" — some platforms reuse-check against multiple prior passwords; "recent" covers that honestly. "Try a new one" is shorter and more human than "Please choose a different password."

### 6.3 Server-side "too weak" fallback — **[NOTE: zxcvbn removed 2026-05-26]**

~~This fires when zxcvbn client-side scored the password as Good/Strong but server-side validation disagrees~~. zxcvbn removed — two-state rewrite 2026-05-26. This scenario now resolves differently: if all 5 client-side rules pass (isStrong) but server rejects, use the generic 6.1 error. The copy string below is still valid if the server returns a "too weak" response code.

**Where it appears:** Below the password field, all contexts.

**String:**
> `This password isn't strong enough. Try adding more variety.`

Character count: 58.

**Rationale:** "Variety" is a plain-language way to say "different character types" without jargon. "Isn't strong enough" matches the tone of the meter — same vocabulary. Does not say "too weak" (that is the internal tier label, not an error message).

### 6.4 Rate-limit hit (`reset` context only)

**Where it appears:** Below the password field in `reset` context when too many reset attempts have been made.

**String:**
> `Too many attempts. Wait a few minutes, then try again.`

Character count: 53.

**Rationale:** Tells the user what happened (too many attempts), what to do (wait), and when (a few minutes). "A few minutes" is honest and human — more specific time estimates (e.g., "15 minutes") can be inaccurate and create frustration if the real wait differs.

---

## 7. Success States

### 7.1 Password reset complete

**Where it appears:** At the page level after successful password reset, replacing the reset form. This is outside the component's scope — it is a page-level message — but the component's design-team owns the string.

**String:**
> `Your password has been updated. You can now sign in.`

Character count: 51.

**Rationale:** "Has been updated" is past tense — confirms the action is complete. "You can now sign in" is the next step — forward-facing, no lingering on what just happened.

### 7.2 Password settings change complete

**Where it appears:** At the page or form level after a successful settings password change.

**String:**
> `Your password has been updated.`

Character count: 31. Shorter than the reset version — no need to instruct the user to sign in, because they are already signed in.

### 7.3 Registration context note

Registration success copy is owned by the registration flow, not this component. If the team asks for a suggested line:

> `Your account is ready.`

Six words. No exclamation mark. Calm confidence.

---

## 8. Alt Text and Accessible Descriptions

### 8.1 Show/hide toggle icon

See Section 2. The `aria-label` on the button carries the accessible name. The icon inside the button is decorative (`aria-hidden="true"`).

### 8.2 Checklist icons — are they decorative?

**Decision: checklist icons are decorative. The text carries the state.**

The checklist item text ("At least 10 characters") is sufficient. The icon fills and dims alongside the text. A screen reader user who hears "At least 10 characters" from the list does not need a separate icon announcement — the live region (Section 5) handles state change announcements.

Implementation:
- All checklist icons: `aria-hidden="true"`
- The checklist item wrapper element: no special role needed — it is a list item (`<li>`) in a plain list
- The list itself: `<ul>` with `aria-label="Password requirements"` so screen reader users know what list they are navigating

### 8.3 Strength meter — role and accessible description

The meter is a visual indicator. It does not need to be an interactive element. Its accessible implementation:

```
role="meter"
aria-valuemin="0"
aria-valuemax="4"
aria-valuenow="{currentScore}"
aria-valuetext="{tierLabel}"
aria-label="Password strength"
```

Where `{tierLabel}` is the current tier word: `Weak`, `Fair`, `Good`, or `Strong`.

**Before first keystroke** (pre-interaction state, empty field): set `aria-valuenow="0"` and `aria-valuetext="Not rated yet"` — this prevents a premature "Weak" announcement before the user has typed anything.

**Why `role="meter"` and not `role="progressbar"`:** A progress bar implies movement toward completion. A strength meter is an evaluation, not a progress tracker — it can go backwards. `role="meter"` (ARIA 1.1+) is semantically more accurate. If the builder's browser support requires a fallback, `role="img"` with a descriptive `aria-label` is acceptable.

---

## 9. Vocabulary List

### 9.0 Primary CTA labels by context

Added 2026-05-26 (fix round). **Updated 2026-05-26 (PRD US-5):** registration label changed from "Continue" to "Next".

| Context | Button label |
|---------|-------------|
| `registration` | `Next` |
| `reset` | `Set new password` |
| `settings` | `Update password` |

**[USER OVERRIDE — PRD US-5 2026-05-26]** "Continue" → "Next" for registration. The button is now always tappable in idle state (was gated at Good strength). Button mode labels: `Next` (idle), `Checking…` (blacklist in flight), `Creating account…` (submitting), then replaced by "Account created" heading + "Start over" link on success.

**Rationale:** "Next" implies a step in a flow (still correct for registration). "Continue" was appropriate when the button was gated — the naming implied you could only move forward once ready. "Next" is more appropriate for a button that is always pressable and provides guidance when not ready.

### 9.1 Preferred words — use these

| Use | Notes |
|-----|-------|
| `password` | Not "passcode" (implies PIN/numeric), not "passphrase" (implies phrase format), not "credentials" (jargon) |
| `number` | Not "digit" |
| `letter` | Not "character" when referring to alphabetic characters specifically |
| `symbol` | Not "special character", not "non-alphanumeric" |
| `uppercase` | Acceptable technical term — universal across languages |
| `lowercase` | Same |
| `stronger` / `strong` | Not "secure" (implies the alternative is insecure), not "robust", not "complex" |
| `strength` | As in "Password strength" — plain and established |
| `meets the requirements` | Preferred confirmation phrase — not "is valid", not "passed", not "accepted" |
| `works` | As in "Your new password works as soon as you save it" — plain and concrete |
| `save` | Preferred CTA verb for settings context |
| `continue` | Preferred for registration context forward action |

### 9.2 Banned words — do not use these

| Do not use | Reason | Use instead |
|-----------|--------|-------------|
| `invalid` | Error language — implies the user did something wrong | `doesn't meet the requirements` |
| `failed` | Error language | `something went wrong` |
| `rejected` | Error language | `something went wrong` / `try a different password` |
| `error` | Only acceptable as a label for the error container itself — not in copy text | — |
| `alphanumeric` | Jargon | `letters and numbers` |
| `special character` | Jargon | `symbol` |
| `digit` | Slightly technical | `number` |
| `passphrase` | Implies format the system doesn't require | `password` |
| `passcode` | Implies PIN/numeric | `password` |
| `credentials` | Too broad / enterprise jargon | `password` |
| `complexity` | Meta-language — the user doesn't need to know the feature name | `strength` |
| `secure` | When used as in "your password is now secure" — implies the baseline was insecure | `strong` / `stronger` |
| `must` | Commands the user | rephrase as description: "At least 10 characters" not "Must be at least 10 characters" |
| `You're all set` | Idiom, does not translate well | `You can continue` / `Your password meets the requirements` |
| `Almost there` | Idiom, creates false proximity | omit or use tier label |
| `Uh oh` | Informal, alarming | omit — error copy does the job |

---

## 10. Reading Level Assessment

| Section | Sample string | Grade level |
|---------|--------------|-------------|
| Field labels | `Create a password` | Grade 2 |
| Helper text | `Your password keeps your account secure.` | Grade 5 |
| Reset info box | `Your new password works as soon as you save it.` | Grade 4 |
| Checklist (unmet) | `At least 10 characters` | Grade 2 |
| Checklist (symbol) | `A symbol makes it stronger` | Grade 3 |
| Error (generic) | `Something went wrong. Try a different password.` | Grade 5 |
| Error (reuse) | `This is the same as a recent password. Try a new one.` | Grade 4 |
| Success (reset) | `Your password has been updated. You can now sign in.` | Grade 5 |
| Tier tooltips | `Your password is easy to guess. Keep going — the checklist below shows what to add.` | Grade 6 |

Overall: **Grade 4–6**. Target was Grade 6–8. The copy comes in below target, which is a pass — simpler is better.

---

## 11. Screen Reader Narration Notes

### DOM order matters here

The component's DOM order should follow this sequence for screen reader coherence:

1. Field label ("Create a password")
2. Helper text (if present)
3. Info box (reset context only)
4. Password input field
5. Show/hide toggle button
6. Submit message slot (below field underline, above meter — see §11.1)
7. Meter (with `role="meter"`, updates via live region)
8. Checklist (`<ul aria-label="Password requirements">`)

**Submit message placement:** The submit message slot sits between the field and the meter — visually and in DOM order. The screen reader reads: field → submit message (if present) → meter → checklist.

### §11.1 Submit messages — count-based, blur-driven (brief 2026-05-26)

**[NEW — brief 2026-05-26]** Replaces the old §4.7 single-string Next-tap hints.

15 distinct strings determined by the number of unmet rules (in checklist order: length → lowercase → special → uppercase → number).

**Trigger:** Message is silent until `hasInteracted` is true (first blur with invalid input, or Next tap with invalid input). Updates live as user types. Clears immediately when all rules are met.

**Slot aria:** `aria-live="polite"` + `aria-atomic="true"`. `aria-hidden="true"` when no message (reserved slot always in DOM). The input's `aria-describedby` includes the slot id when a message is present.

**All 15 strings — use verbatim:**

| Condition | String |
|-----------|--------|
| Empty field | `Enter a password` |
| 1 unmet: length | `Use at least 8 characters` |
| 1 unmet: lowercase | `Add a lowercase letter` |
| 1 unmet: special | `Add a special character` |
| 1 unmet: uppercase | `Add an uppercase letter` |
| 1 unmet: number | `Add a number` |
| 2 unmet: length + lowercase | `Use at least 8 characters and add a lowercase letter` |
| 2 unmet: length + special | `Use at least 8 characters and add a special character` |
| 2 unmet: length + uppercase | `Use at least 8 characters and add an uppercase letter` |
| 2 unmet: length + number | `Use at least 8 characters and add a number` |
| 2 unmet: lowercase + special | `Add a lowercase letter and a special character` |
| 2 unmet: lowercase + uppercase | `Add a lowercase letter and an uppercase letter` |
| 2 unmet: lowercase + number | `Add a lowercase letter and a number` |
| 2 unmet: special + uppercase | `Add a special character and an uppercase letter` |
| 2 unmet: special + number | `Add a special character and a number` |
| 2 unmet: uppercase + number | `Add an uppercase letter and a number` |
| 3+ unmet | `Your password needs a few more things` |

**Icon:** `CircleAlertIcon` (16px, stroke circle with exclamation mark). `aria-hidden="true"`. Uses `currentColor` — inherits message red (#B91C1C). 4px gap between icon and text.

**Reading level:** Grade 4–5. All strings are imperative directives (Add / Use / Complete). Fits the Grade 6–8 target comfortably.

### Live region placement

The polite live region (`aria-live="polite"`) should be in the DOM but visually hidden (`sr-only` / `position: absolute; width: 1px; height: 1px; overflow: hidden`). It is separate from the meter and checklist elements. When the tier changes or a rule changes state, the live region text is updated and read by the screen reader without interrupting typing.

### The confirm field

**[DEPRECATED — User override 2026-05-26]** The confirm field has been removed. This section is retained for reference.

~~The confirm field appears below the primary password field in the DOM. It does not have its own meter or checklist — it inherits the primary field's show/hide state via the shared toggle. Screen reader users do not need a live announcement for the confirm field matching the primary field, but a mismatch error (if passwords don't match at submit) should be announced. See error handling — the mismatch string is:~~

~~`Passwords don't match. Check both fields and try again.`~~

~~This is a submit-time validation error, not a live typing error. It appears below the confirm field in the error slot, associated with that field via `aria-describedby`.~~

---

## 12. Strings Reference (Quick List for Builder)

**[UPDATED — PRD US-5 2026-05-26]** Rule set, hint messages, rejection notice, button labels, and success state all updated below.

All final strings in one place. Use verbatim.

### Primary CTA (button labels by context) — [UPDATED PRD US-5]
- Registration: `Next`
- Registration (checking): `Checking…` **[INACTIVE — flag-gated, see FEATURES.BLACKLIST_CHECK]**
- Registration (submitting): `Creating account…`
- Reset: `Set new password`
- Settings: `Update password`

### Success state — [NEW PRD US-5]
- Heading: `Account created`
- Link: `Start over`

### Field labels
- Registration password: `Create a password`
- Reset / Settings password: `New password`
- Registration confirm: `Confirm your password` **[DEPRECATED 2026-05-26 — confirm field removed]**
- Reset / Settings confirm: `Confirm your new password` **[DEPRECATED 2026-05-26 — confirm field removed]**

### Helper text
- Registration: `Your password keeps your account secure.`
- Reset: `Create a new password for your account.`
- Settings: `Update your account password.`

### Reset info box
- `Your new password works as soon as you save it.`

### Toggle
- Password hidden (show state): `aria-label="Show password"`
- Password visible (hide state): `aria-label="Hide password"`

### Strength labels — **[UPDATED two-state rewrite 2026-05-26]**
- Active: `Weak` (1–4 rules met) / `Strong` (all 5 rules met)
- ~~Deprecated (four-tier): `Fair` / `Good`~~

### Strength aria-descriptions
- Weak: `Your password is easy to guess. Keep going — the checklist below shows what to add.`
- Strong: `Your password is very hard to guess. You're ready to go.`
- ~~Deprecated: Fair / Good descriptions — see §3.2~~

### Checklist (all contexts, static strings) — [UPDATED Figma 2026-05-26: "One X" convention + new order]
Order: length → lowercase → special → uppercase → number

1. `At least 8 characters`
2. `One lowercase letter`
3. `One special character`
4. `One uppercase letter`
5. `One number`

### Live counter (length rule only, while unmet) — [UPDATED threshold: 10 → 8]
- `· {n} of 8` (appended to rule label: "At least 8 characters · 3 of 8")

### Field-level error hint messages — [NEW PRD US-5]
- Empty: `Enter a password to continue.`
- Length: `Make it at least 8 characters to continue.`
- Uppercase: `Add an uppercase letter to continue.`
- Lowercase: `Add a lowercase letter to continue.`
- Number: `Add a number to continue.`
- Special char: `Add a special character to continue.`

### Inline rejection notice — [UPDATED 2026-05-26: two-tier] [INACTIVE — flag-gated, see FEATURES.BLACKLIST_CHECK]
- Status label: `Not accepted`
- Supporting text: `This password is too common — please choose another.`
- Screen reader reads both in order: `Not accepted. This password is too common — please choose another.`

### Live region — tier change
- `Password strength: Weak`
- `Password strength: Fair`
- `Password strength: Good`
- `Password strength: Strong`

### Live region — rule met — [UPDATED PRD US-5]
- `Length met — 8 or more characters`
- `Uppercase letter added`
- `Lowercase letter added`
- `Number included`
- `Special character added`

### Live region — rule broken — [UPDATED PRD US-5]
- `Length no longer met — need 8 or more characters`
- `Uppercase letter no longer included`
- `Lowercase letter no longer included`
- `Number no longer included`
- `Special character removed`

### Bridging hint — [DEPRECATED PRD US-5 2026-05-26]
- Submission is no longer tier-gated. The bridging hint is gone. The field-level error replaces it.
- ~~`Your password is too easy to guess. Make it longer or use different letters and numbers.`~~

### Live region — submit threshold crossed
- `Your password meets the requirements. You can continue.`

### Errors
- Generic: `Something went wrong. Try a different password.`
- Reuse: `This is the same as a recent password. Try a new one.`
- Server weak: `This password isn't strong enough. Try adding more variety.`
- Rate limit (reset only): `Too many attempts. Wait a few minutes, then try again.`
- Confirm mismatch: `Passwords don't match. Check both fields and try again.` **[DEPRECATED 2026-05-26 — confirm field removed]**

### Success
- Reset: `Your password has been updated. You can now sign in.`
- Settings: `Your password has been updated.`
- Registration (suggested, owned by registration flow): `Your account is ready.`

### Meter accessible name
- `aria-label="Password strength"`
- `aria-valuetext="Not rated yet"` (pre-interaction)
- `aria-valuetext="{tierLabel}"` (during interaction)
