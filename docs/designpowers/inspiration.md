# Inspiration Board: Password Complexity
**Agent:** inspiration-scout
**Date:** 2026-05-26
**Brief target:** Meter + checklist, combined. Tone: calm confidence with warmth, dialled back from Mailchimp for a regulated gambling platform.

---

## How to Read This Board

Each reference is annotated with: what it does, why it works, what to steal, what to leave, and an accessibility read. The synthesis section at the end distils the actionable patterns and anti-patterns.

---

## References

### 1. Mailchimp — The Anchor Reference

**URL:** https://login.mailchimp.com/signup/

**What it does**
Checklist-only pattern. Seven rules displayed below the password field from the moment the user activates it: "One lowercase character", "One uppercase character", "One number", "One special character", "8 characters minimum", "Must not contain username", "50 characters maximum". Each ticks off live as the user types. Show/hide toggle present. No strength bar.

**Why it works**
The checklist is exhaustive and specific — the user is never surprised by a rejection because every rule is visible and trackable in real time. The tone is matter-of-fact but not harsh. The copy uses plain-language fragments ("One number") rather than jargon ("alphanumeric character required"). Crucially, Mailchimp's brand voice earns them warmth through the *surrounding* UI — the checklist itself is functionally neutral; it reads friendly because it lives inside a product that already feels friendly.

**What we'd steal**
- Live tick-off interaction: rules check (not just fill) as conditions are met
- Copy structure: "One [thing]" — short, parallel, scannable
- Show/hide toggle as a first-class control, not an afterthought
- Upfront display on field activation, not on error

**What we'd leave**
- Checklist-only: NNGroup research (2013, cited in their 2024 article) shows strength meters outperform checklists alone at motivating genuinely stronger passwords. Users with a checklist stop at "all boxes ticked"; users with a meter keep going.
- Seven rules is a long list. On mobile at 375px, this becomes a vertical scroll inside the form. Three to five is the comfortable cognitive ceiling.
- "Must not contain username" is a validation rule, not a creation guide. It belongs in error state, not in the upfront checklist.

**Accessibility read**
Confirmed show/hide toggle. No explicit aria-live or screen reader announcement pattern is evident from the page source. The checklist structure suggests checkmark icons are likely used — if colour-only (green tick vs. grey tick), this risks failing for colour-blind users. Cannot verify this without a live test. **Caution:** treat Mailchimp's accessibility as unverified at this stage.

---

### 2. GitHub — The Rigour Benchmark

**URL:** https://github.com/signup

**What it does**
Static upfront rules only. No live meter. No live checklist. The password field displays a single static text instruction: "Password should be at least 15 characters OR at least 8 characters including a number and a lowercase letter." The rule does not update as the user types; errors appear only on form submission or tab-out.

**Why it works**
The design works for GitHub's audience (developers who have high password literacy and patience) but not for a general-population signup. What it does well: the rule is written in plain, OR-logic language that respects user intelligence — "15 characters OR 8 characters + complexity". This is the NIST 800-63 approach (length-first, complexity optional) rather than the traditional four-character-class checklist. It also sets a higher floor (15 characters) than most products, pushing users toward passphrases.

**What we'd steal**
- The OR-logic framing: length is the primary lever, character complexity is the fallback. This is the correct security model and reduces friction for users who use passphrases.
- Copy pattern: rule as a single sentence rather than a bullet list — works for a simpler rule set.

**What we'd leave**
- No live feedback at all: this is the "submit-then-tell-them" pattern the brief explicitly rules out
- Static text is invisible to users who skim; most users don't read it before typing
- Works for developers, not for mixed-literacy players registering to gamble under time pressure

**Accessibility read**
Static text instructions are actually the most accessible starting point — no reliance on dynamic ARIA updates, colour, or icons. The field is labelled, marked required. No dynamic interaction means no dynamic accessibility problems. The tradeoff is zero UX value for users who need guidance mid-entry.

---

### 3. 1Password — The Generation Reference

**URL:** https://1password.com/password-generator / https://1password.com/blog/a-smarter-password-generator

**What it does**
1Password's generator (in-app and web tool) shows the generated password itself as the primary feedback. Strength is communicated implicitly through the generation algorithm, not a visual meter. The interface is described as "clean and simple — sparse because you don't really need it." Users can adjust a "recipe" (length, character classes) and the password updates in real time. No traditional strength bar is present on the generator; the framing is "we generated a strong one for you" rather than "rate what you typed."

**Why it works**
The genius of 1Password's approach is inverting the interaction: instead of asking users to type and then judging them, it generates and asks them to accept or adjust. The copy tone is confident and light — they refer to their algorithm as "one smart cookie." This creates trust through competence rather than through visual certification.

**What we'd steal**
- Confidence framing: the meter or checklist should feel like *assistance*, not an exam. Copy should coach, not grade.
- Passphrase as an option: 1Password's OR-logic approach (random characters OR words) reduces cognitive load for users who struggle with complex passwords. Worth considering for the registration flow.
- The idea that feedback can feel *collaborative*, not evaluative.

**What we'd leave**
- The generator-first model doesn't apply here: our users are creating a memorable password they'll use across sessions, possibly without a password manager. We can't pre-generate it for them.
- "Sparse" UI works when the product's job is generation. Our product's job is coaching.

**Accessibility read**
1Password's web generator is a well-funded product from a company with a strong accessibility track record. Toggle controls, clipboard copy, and keyboard navigation are expected to be solid — but we cannot verify specifics of the in-app generator from external research. No red flags in available sources.

---

### 4. Apple ID — The Invisible Hand Reference

**URL:** apple.com account creation / iOS Settings

**What it does**
Apple's approach on iOS is predominantly system-level: when a password field is focused with `autocomplete="new-password"`, iOS offers a strong generated password via system dialog. On Apple ID account creation via web, the strength indicator appears as a brief coloured pill or text label below the field. Specific current visual details could not be verified from available sources without live testing — Apple's signup flow changes with OS and browser versions. What is confirmed: Apple's system auto-generates 20-character passwords (1 digit, 1 uppercase, 2 hyphens, 16 lowercase) when iCloud Keychain is active, bypassing the strength question entirely.

**Why it works**
Apple's design philosophy is to remove the decision entirely when possible. The best password UX is no password UI — just accept the generated one. The strength meter (where it appears) is treated as a soft signal, not an obstacle.

**What we'd steal**
- The concept of *offering* a strong password rather than just evaluating one: a "suggest a strong password" affordance in the registration form is out of scope for this sprint but worth naming as a future enhancement
- Brevity: Apple's strength labels are 1-2 words ("Strong", "Medium", "Weak") — no explanatory prose around the meter itself; the checklist does the explaining

**What we'd leave**
- iOS system integration: our platform is a web-based registration form, not a native app with Keychain access
- Apple's approach depends on users trusting the generated password and using a password manager. Many of our users (mixed literacy, registering on mobile) may not use any password manager.

**Accessibility read**
Apple's system-level password suggestions are highly accessible (native controls, full VoiceOver support). The web-based Apple ID flow's accessibility cannot be confirmed from available sources. Apple's overall accessibility reputation is strong, but their web properties vary more than their native apps.

---

### 5. GOV.UK Design System — The Accessibility Foil

**URL:** https://design-system.service.gov.uk/patterns/passwords/

**What it does**
No strength meter at all. GOV.UK's password pattern is the purest accessibility-first approach in this review: minimum 8 characters, no mandatory character classes (following NIST guidance), a blocklist of common passwords, and a "show password" toggle. All constraints are stated upfront in plain text. Password pasting is explicitly encouraged. No inline validation or live feedback — research is cited as inconclusive on its effectiveness.

**Why it works**
GOV.UK's pattern works for a trust-critical, high-compliance context where the service caters to the full UK population including elderly users, low-literacy users, and users on assistive technology. The principle is: "Do not make me jump through hoops to complete this form." The copy is functional, non-threatening, and assumes no prior password knowledge.

**What we'd steal**
- Explicit encouragement of password pasting: this removes friction for password manager users and is WCAG-friendly. Almost no products in this review mention it.
- "No maximum length" combined with a minimum: letting users create 40-word passphrases respects password manager users and passphrase fans
- The caution about forced complexity: character-class requirements correlate with weaker actual passwords (users substitute letters for numbers predictably: "P@ssw0rd"). Worth revisiting whether our rules are based on security evidence or tradition.
- Copy tone: functional, calm, zero condescension — this is the floor we should meet before adding warmth on top

**What we'd leave**
- No live feedback: the brief has already decided against this, and NNGroup's research supports live feedback's value
- Zero personality: GOV.UK's tone is deliberately neutral for civic context. Our platform needs to communicate warmth and confidence during a commercial signup
- The "further research needed" note on inline validation: for our use case, the evidence for live feedback is strong enough

**Accessibility read**
This is the strongest accessibility implementation in the review. Plain text instructions, pasting permitted, static rules, no colour dependency, screen reader-friendly by default. The tradeoff is that it provides no coaching — it tells users the rules but doesn't help them meet them. Our design needs to be *at least as accessible as this* while adding the guidance layer on top.

---

### 6. FanDuel Formation Design System — The Regulated Gambling Wild Card

**URL:** https://fanduel.design/formation/components/password-strength-meter/

**What it does**
FanDuel's public design system (Formation) includes a dedicated password strength meter component. It uses the zxcvbn library for strength estimation — the same library the brief implies via the open question about scoring. Four strength levels: Poor, Fair, Good, Excellent (equivalent to zxcvbn's 0–4 scale). The component sits in the helper text area of the text field, keeping visual weight below the input. The design system has an explicit accessibility commitment and WCAG alignment.

**Why it works**
This is the most directly analogous reference in the set: a regulated gambling platform, a public design system, zxcvbn-based scoring, four named levels. The four-level scale (rather than three) adds nuance without complexity — users who reach "Good" but not "Excellent" can see there's room to improve. The placement in helper text keeps the field visually clean.

**Why it's a wild card**
FanDuel is a competitor-adjacent product (sports betting rather than casino, but same regulatory environment and same user anxiety around onboarding and responsible gambling compliance). This reference usually lives in design-scout territory (same domain). It's included here because it's a *public design system*, which means the patterns are intended for study, and because it directly solves the same problem with a similar tool stack.

**What we'd steal**
- zxcvbn as the scoring engine: it's what FanDuel uses, it's what zxcvbn-ts makes available for modern stacks, and it evaluates real-world password strength (dictionary attacks, patterns, common passwords) rather than character-class ticking
- Four levels with named labels rather than three (which can feel binary) or five (which adds little signal)
- Helper text placement: keeps the input line visually dominant; feedback sits below, not beside
- The framing of strength labels as quality tiers, not failure grades — "Excellent" is aspirational, not a pass/fail threshold

**What we'd leave**
- Cannot access the component directly (403 response) — specific colour choices, contrast ratios, and exact copy cannot be verified. Treat as a structural reference, not a visual one.
- FanDuel's brand is high-energy sports betting; their visual language is bolder than our "calm confidence with warmth" target

**Accessibility read**
FanDuel's public commitment to WCAG and assistive technology is credible; their design system principles page specifically cites accessibility. However, specific contrast ratios and ARIA implementation for the password component could not be verified from available sources. **Recommended:** visit https://fanduel.design/formation/components/password-strength-meter/ directly before finalising our own patterns to verify their implementation decisions.

---

### 7. NNGroup Research — The Evidence Base (Not a Product, But Load-Bearing)

**URL:** https://www.nngroup.com/articles/password-creation/

**What it does**
Not a product UI but a direct evidence source for the brief's design direction. Key findings:
1. Strength meters outperform checklist-only patterns at motivating genuinely strong passwords (Egelman et al., 2013). Users with meters keep improving; users with checklists stop at compliance.
2. Show password on mobile should be *on by default*, not opt-in — shoulder-surfing is less of a risk on mobile, and typing errors are more common.
3. Requirements should appear on field activation, not on submission error.
4. Copy that frames rules as benefits rather than restrictions shifts user psychology from compliance to motivation.

**Why it matters here**
The brief already calls for meter + checklist combined — which NNGroup's research supports. But the specific finding about *mobile show-by-default* is a concrete interaction decision that is easy to miss. Most products in this review default to masked text on mobile. NNGroup says that's wrong for mobile forms.

**What we'd steal**
- Mobile: show password visible by default, with a "hide" toggle (not the reverse)
- Copy framing: "Your password is strong" vs. "Password meets requirements" — the first is a compliment, the second is a grade
- The combined pattern is validated by the research, not just assumed

**What we'd leave**
- N/A: this is research, not a product. Read it, don't copy it.

**Accessibility read**
Research cites mobile typing errors as an accessibility concern — larger touch targets and default-visible passwords reduce errors for users with motor difficulties. Relevant for our "Motor / touch" persona.

---

## Synthesis

### 3–5 Patterns Most Worth Carrying In

**1. Combined meter + checklist, with the meter as the emotional signal**
The meter shows the overall quality of the password (and motivates users to go beyond minimum compliance). The checklist shows which specific rules remain. These two elements serve different cognitive functions and should be visually distinct: meter above or alongside the input for immediate feedback; checklist below for specific guidance. Source: NNGroup research + Mailchimp (checklist craft) + FanDuel Formation (meter structure).

**2. Live tick-off interaction on the checklist**
Rules should *check off* as conditions are met — not just un-highlight or change colour. A completed state is rewarding; it communicates "you finished this item." The Mailchimp implementation confirms the pattern. The copy structure "One [thing]" (short, parallel fragments) is worth inheriting. Five rules maximum for mobile legibility.

**3. Strength labels as quality tiers, not pass/fail grades**
"Weak / Fair / Good / Strong" (or equivalent) frames the feedback as a quality scale the user is climbing, not a binary test they are passing or failing. FanDuel Formation uses four levels. The label copy should sit at the end of the meter bar, not as a separate line. Labels should be text + icon (not colour alone) for WCAG compliance.

**4. Show password visible by default on mobile**
NNGroup's evidence-backed finding. Our primary persona is mobile. Default to visible text; offer a "hide" toggle. On desktop, reverse this. This single interaction decision reduces entry errors and improves accessibility for motor-impaired users simultaneously.

**5. GOV.UK-floor copy: functional, calm, zero jargon**
Before adding warmth, ensure the baseline copy meets GOV.UK's standard — plain language, no "alphanumeric", no "special character" (say "symbol" or "e.g. # $ %"), no condescension. Warmth is added on top of functional copy, not instead of it. The GOV.UK pattern also explicitly encourages password pasting — our implementation must not block it.

---

### 2–3 Anti-Patterns to Avoid

**Anti-pattern 1: Post-submit rejection**
GitHub and older form patterns reveal password complexity errors only after the user clicks submit. The brief already rules this out — but naming it explicitly prevents regression. Every rule must be visible and checkable before the submit button is live.

**Anti-pattern 2: Colour-only strength signalling**
Standard red/amber/green traffic light meters fail accessibility at multiple points. Standard green (#00FF00) achieves 1.4:1 contrast on white — far below WCAG AA (3:1 for non-text), let alone the brief's AAA target (7:1 for text). The strength meter must use a combination of: filled bar segments (shape), text labels (label), and purpose-designed colours that meet contrast requirements. Standard brand colours (blue #378BDA) need checking — #378BDA on white is approximately 3.5:1, which passes AA for large text but not body text, and does not reach AAA. The meter colours will need to be purpose-designed or drawn from a dedicated semantic palette.

**Anti-pattern 3: Jokey or punishing copy at either extreme**
"Password so strong, hackers cry 😭" (too playful — Mailchimp's brand can carry this because of established equity; ours cannot and it's inappropriate in a regulated gambling context). "Your password does not meet complexity requirements" (too punishing — treats users as failures). The target is a narrow register: warm, practical, a little encouraging. "Almost there — add a symbol" rather than "Missing: one special character."

---

### Where Mailchimp Is Right vs. Where to Dial Back

**Mailchimp is right about:**
- Live tick-off interaction: this is the correct UX mechanism, fully adopted
- Show/hide toggle as a first-class control
- Rules visible before typing begins
- Copy structure: short, parallel fragments

**Where to dial back for a regulated gambling platform:**
- Volume of personality: Mailchimp's brand warmth lives in mascot, colour, illustration, and copy across the whole product. For a password field in a gambling registration flow, the warmth should come from *tone of voice* and *helpful feedback*, not from wit or playfulness. The field is part of a KYC/compliance-adjacent flow. Light, confident, efficient.
- Checklist-only: add the meter. Mailchimp's pattern is effective for the checklist part; it leaves the motivational function of the meter on the table.
- Rule count: reduce from 7 to 5 or fewer. Remove "Must not contain username" from the upfront list — it's a validation rule, not a creation guide. Surface it as an error only if the user actually does it.

---

## Accessibility Flags for design-lead

These notes are for design-critic and accessibility-reviewer to pick up during review.

1. **Meter colour palette must be purpose-designed** — no product in this review achieves AAA contrast on their strength states. The brief requires it; it will require custom colour choices.
2. **ARIA live region for strength updates** — as the user types, the strength label must be announced by screen readers. Use `aria-live="polite"` on the meter label, not on every keystroke.
3. **Checklist state announcements** — when a rule is satisfied, the screen reader should announce the change. `role="status"` or `aria-live="polite"` on the checklist container. Debounce to avoid flooding.
4. **Show/hide toggle target** — minimum 44x44px (WCAG 2.5.5 AAA). Label must change between "Show password" and "Hide password" — not just icon state.
5. **Mobile default-visible** — confirm this is feasible with the platform's session/security requirements before implementing (some regulated platforms restrict it at policy level, separate from WCAG).
6. **Pasting permitted** — no `paste` event suppression on the password field. Some older implementations block it; this is both a WCAG failure and a security anti-pattern (it blocks password managers).
