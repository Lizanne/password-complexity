# Design Brief: Password Complexity

## Problem Statement
Players need to create strong passwords without abandoning the form. Today's password fields either accept anything (insecure) or punish users with cryptic rejections after they've finished typing (frustrating, drop-off risk). We want feedback that **teaches as it types** — strong enough to satisfy security, gentle enough to keep new players moving.

## Contexts
1. **Registration** — first password, high abandonment risk
2. **Password reset** — emotional state: locked out, possibly frustrated
3. **Account settings** — voluntary change, lower stakes

## Users

### Primary
New players registering an account. Mixed digital literacy, mixed devices (mobile-heavy), often distracted, signing up to play — not to admire a form.

### Secondary
Existing players doing password reset or change. They know the product but may be on mobile, possibly under stress (locked out).

### Ability spectrum
- **Screen reader users** — need live announcements of strength + which rules pass/fail, not just colour
- **Low vision / colour blindness** — strength must not rely on red/yellow/green alone (icon, label, or shape too)
- **Motor / touch** — show/hide toggle must be a real-sized target; no hover-only affordances
- **Cognitive load** — rule list should not balloon; copy in plain language, no jargon like "alphanumeric"
- **Non-native English speakers** — short, common words; consistent verbs

## Design Direction
**Meter + checklist, working together.**
- Meter gives an at-a-glance verdict (weak → strong)
- Checklist shows which rules still need work, ticking off live
- Tone: **calm confidence with a touch of warmth** — Mailchimp-adjacent but dialled back for a regulated platform. Not jokey, not stern.

## Constraints
- Must respect the existing registration-platform-demo design system (tokens at `theme/tokens.ts`: blue accent `#378BDA`, warm neutrals, amber accent)
- Mobile-first
- Live feedback (debounced) — no submit-then-tell-them pattern
- Accessibility: WCAG 2.2 AA minimum; AAA for the meter colour states

## Existing Design System
Tokens mirrored from sibling project `registration-platform-demo/theme/tokens.ts` into `src/index.css` as CSS variables.

## Taste Direction (Early Signal)
- **Reference named**: Mailchimp (famously friendly, confident, slightly playful password meter)
- **Likely cohort to study**: 1Password, Apple ID, Stripe, GitHub — to be confirmed in inspiration-scouting
- **Feel**: calm confidence with warmth, dialled back from Mailchimp's humour to suit a regulated gambling context
- **Inheritance**: blue/warm-neutral palette from registration-platform-demo

## Success Criteria
- New players reach "strong" without help text expanding
- Screen reader users get the same information as sighted users
- Drop-off at password step measurably lower than current baseline
- Zero post-submit rejections for complexity (all rules visible up front)

## Out of Scope
- Password manager integration UX
- Breach checking (haveibeenpwned-style) — possible future
- Multi-factor / passkey flows

## Approved
2026-05-26 — user confirmed brief, location, and tone direction.
