# Visual Decisions — Password Complexity
**Agent:** design-lead
**Date:** 2026-05-26
**Status:** Complete
**References:** strategy.md, inspiration.md, brief 2026-05-26, tokens.ts, WCAG 2.2

---

## How to read this document

These are implementation-ready visual decisions. Every section is specific enough to build from without follow-up questions. Where two options were considered, the rationale for the choice made is included. Accessibility verification (contrast ratios, touch targets) is embedded in the decision, not attached afterward.

---

## 1. Layout and Structure

### 1.1 Overall vertical stack (mobile-first)

```
┌─────────────────────────────────────────────┐
│ Field label                                 │
│   "Create a password"                       │
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ ●●●●●●●●        [eye icon]            │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ [■■□□] Fair                                 │  ← meter row
│                                             │
│ · At least 10 characters            ✓      │  ─┐
│ · Uppercase and lowercase           ✗      │   │ checklist
│ · At least one number               ✗      │   │
│ + A symbol adds strength                   │  ─┘
└─────────────────────────────────────────────┘
```

The meter and checklist are separate rows, stacked vertically. They do not share a row. Reason: on mobile (360–375px), a side-by-side meter + checklist would either require horizontal scrolling or make both elements too small to read. Vertical stacking also preserves the reading order for screen readers — meter verdict first, then specific guidance.

### 1.2 Vertical spacing rhythm

All spacing references `--space-*` tokens from the platform. Two new tokens are added for this component:

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Existing — gap between meter segments |
| `--space-sm` | 8px | Existing — checklist item internal padding |
| `--space-md` | 12px | Existing — gap between field and meter row |
| `--space-lg` | 16px | Existing — gap between meter row and checklist |
| `--space-xl` | 20px | Existing — field label bottom margin |
| **`--space-checklist-item`** | **10px** | **New — gap between checklist rows** |
| **`--space-meter-label`** | **6px** | **New — gap between meter bar and tier label text** |

`--space-checklist-item: 10px` is between the existing 8px and 12px values — the tighter gap reflects that checklist items are a related list, not independent sections. `--space-meter-label: 6px` is tight by design: the label text reads as a caption for the bar, not a separate element.

### 1.3 Full component vertical anatomy (with values)

```
Field label text                           [20px below label]
Password input field                       [44px height minimum]
                                           [12px gap]
Meter row (bar + label)                    [14px height bar]
                                           [16px gap]
Checklist                                  [4 items × (20px line-height + 10px gap)]
```

Total height when checklist visible (approximate): 44 + 12 + 20 + 16 + 120 = ~212px. This is the committed height — no collapse on blur per user override.

### 1.4 Field width behaviour

- Mobile (< 480px): full width of the containing column, no max-width
- Tablet (480px–767px): full width of the containing column, max-width 480px
- Desktop (≥ 768px): max-width 480px, left-aligned within the form

The component never stretches beyond 480px. On wider screens the checklist and meter stay anchored to the field width — they do not spread wider than the input.

### 1.5 Component container

No card/panel wrapper of its own. The component inherits its card or surface context from the parent form (white card `#FFFFFF` or page bg `#F4F4F5`). All contrast ratios are verified against both.

---

## 2. The Meter

### 2.1 Segmented — **[SUPERSEDED: 4 → 3 segments, two-state rewrite 2026-05-26]**

~~Four discrete segments, one per tier.~~

**SUPERSEDED 2026-05-26:** Three segments (down from 4). The segment count maps to the two-state model — 3 fills for the highest state (all rules met) rather than 4 fills for a four-tier ladder. Segment count still provides redundant coding (P2): 0/1/2/3 filled communicates progress even in forced-colour mode.

Three segments is the right number for the two-state model — one segment per 1–2 rules bucket, scaling to three-of-three for Strong.

~~Four segments is the right number — not eight or twelve.~~ (Superseded by two-state spec 2026-05-26.)

### 2.2 Segment dimensions — **[SUPERSEDED: height 4px, 3 segments; user override of 8px now superseded]**

**SUPERSEDED 2026-05-26 (new spec overrides prior user override of 8px):**

| Property | Value | Rationale |
|----------|-------|-----------|
| Segment height | **4px** *(was 8px per prior user override; new spec: 4px)* | Subtle measurement instrument, does not compete with checklist |
| Segment width | Equal fractions of available width, minus gaps | `calc((100% - 2 × 4px) / 3)` per segment |
| Gap between segments | 4px (`--space-xs`) | Clearly distinct segments, not touching |
| Corner radius | 3px on all corners | Unchanged |

~~Segment height: 6px~~ → ~~8px (user override 2026-05-26)~~ → **4px (new spec 2026-05-26 — supersedes both prior values)**.

### 2.3 Active vs inactive states — **[SUPERSEDED — two-state palette 2026-05-26]**

~~| State | Visual treatment |~~
~~|-------|-----------------|~~
~~| Active Weak (1 segment) | Fill: `#A66C25` (amber) |~~
~~| Active Fair (2 segments) | Fill: `#B37726` (amber) |~~
~~| Active Good (3 segments) | Fill: `#2878C8` (blue) |~~
~~| Active Strong (4 segments) | Fill: `#1558A0` (blue) |~~

**SUPERSEDED 2026-05-26 — new two-state active states:**

| State | Visual treatment |
|-------|-----------------|
| Inactive segment (track) | Fill: `#929292` — 3.11:1 vs white (non-text pass) |
| Active progress (1–2 of 3 filled) | Fill: `#3f3f3f` — 10.53:1 vs white; 3.38:1 vs track (non-text pass) |
| Active strong (3 of 3 filled) | Fill: `#1E7A3A` (forest green) — 5.38:1 vs white; 4.90:1 vs #f4f4f5 (non-text pass, ≥3:1) |

**Spec inconsistency resolution (documented in build-log):** The spec table listed "red" for 1–4 rule states; the spec prose explicitly says "Drop amber/red — segments fill grey as the player makes progress." Prose is authoritative. Grey implemented.

### 2.4 Tier label — **[SUPERSEDED: two-state Weak/Strong only 2026-05-26; position updated: above bar 2026-05-26]**

~~The label ("Weak" / "Fair" / "Good" / "Strong")~~ **The label ("Weak" / "Strong" only)** ~~sits immediately to the right of the bar, on the same row, vertically centred with the bar.~~ **sits directly above the bar, left-aligned (2026-05-26 direction).**

```
[■ □ □ □]  Weak           <- prior: label right of bar (superseded)
[■ ■ □ □]  Fair
[■ ■ ■ □]  Good
[■ ■ ■ ■]  Strong
```

**Current layout (2026-05-26 direction):**

```
Weak                       <- label above bar, left-aligned
[■ □ □]                    <- bar takes full width of container

Strong
[■ ■ ■]
```

~~Alternative considered: label below the bar. Rejected because it adds a full row of height and creates ambiguity about whether the label belongs to the meter or the checklist below.~~

**Label position (updated 2026-05-26):** above bar, left-aligned. Gap between label and bar: `var(--space-xs, 4px)` — tight enough that the label reads as a caption for the bar, not a separate element. The prior "right of bar" position is superseded by user direction.

Prior "label right of bar" rationale is archived: it was rejected for adding a second layout dimension (the label competed with the bar's width). The above-bar position reclaims full bar width and reads with clearer ownership.

**Label absent until first keystroke.** Before the user begins typing, neither the bar label is shown. The bar renders on page load (3 grey unfilled segments — see Section 2.6). The label appears on first keystroke. A reserved-height slot (`min-height: 18px` matching 13px/18px label line-height) ensures the bar does not shift down when the label appears.

- **Checklist:** visible from page load (user override 2026-05-26).
- **Meter bar:** visible from page load (3 unfilled segments).
- **Meter label:** appears on first keystroke (when there is something to score).

### 2.5 Transition behaviour (note for motion-designer)

The meter transitions between tiers. Specific easing and duration are for the motion-designer to specify, but the design intent is:
- Progression forward (Weak → Fair → Good → Strong): should feel like a reward — a clean fill
- Regression backward (e.g., Strong → Good after editing): should feel accurate and calm, not punishing — do not flash or bounce
- Each active segment should transition as a unit, not character-by-character
- Strongly recommend no per-keystroke animation — tied to the 300ms debounce

### 2.6 Empty/pre-interaction state

Before first keystroke: show four inactive segments (`#929292`) with no label. This primes the user that a meter exists and shows the four-slot structure without implying any current score. The checklist is visible (it appeared on focus); the meter track is visible but unscored.

Reason for showing the inactive track: if the track is entirely absent before typing, the meter "pops in" on first keystroke, which can startle. Showing the empty track is a gentler way to introduce the component.

**User override 2026-05-26:** Meter track is now visible on page load, not on focus. The checklist was already always visible; making the meter track match it removes the pre-focus seam (DD-002). Implemented: `showMeter` constant `true`, `.pf-meter-track` opacity animation removed.

---

## 3. The Checklist

**User override 2026-05-26:** Checklist is now visible on page load (not gated on field focus). The meter track also renders on page load. See Section 2.6 override note.

**[USER OVERRIDE — PRD US-5 2026-05-26]** Rule set changed. Five rules, all mandatory. caseMix split into two rules. Symbol promoted. Bonus framing (`+` icon, muted copy, no check) is retired — all rules use circle-outline/circle-check. PlusOutlineIcon / PlusFilledIcon remain in the codebase as dead code. The `.pf-checklist-item--bonus` CSS class is also dead but retained (harmless). See §3.2 and §3.4 override notes below.

### 3.1 Checklist item structure

Each item is a single row:

```
[icon]  [rule text]                    (no trailing indicator on right)
```

- Icon: 16px × 16px visible, 20px × 20px including optical padding
- Icon to text gap: 8px (`--space-sm`)
- Full item height (with padding): 32px minimum (comfortable for reading; not an interactive touch target — these items are informational only)

### 3.2 Icon choices

**[USER OVERRIDE — PRD US-5 2026-05-26]** Bonus row (rows 3–4 below) is now retired. All five rules use circle icons. `+` icon and bonus framing removed.

| State | Icon | Colour | Rationale |
|-------|------|--------|-----------|
| Unmet (mandatory) | Circle outline (stroke, no fill) | `--color-muted` `#52525b` | Neutral — not an X, not a warning. Signals "not yet done", not "wrong". |
| Met (mandatory) | Circle with checkmark inside (filled) | Met icon colour: `#16548E` (same as the meter's Good label text, AAA on white) | Completion, not correctness. Filled circle + check = done. |
| ~~Bonus (symbol, unmet)~~ | ~~Plus sign `+` in circle outline~~ | ~~`--color-muted`~~ | **RETIRED — PRD US-5. Symbol is now mandatory.** |
| ~~Bonus (symbol, met)~~ | ~~Plus sign `+` in filled circle~~ | ~~`#16548E`~~ | **RETIRED — PRD US-5.** |

No X icon anywhere. The unmet state is a neutral open circle — it communicates "available to fulfil" rather than "you have failed this". This serves P4 directly.

### 3.3 In-list quieting strategy for met rules

When a rule is met, the item transitions to a quieter state. The changes are:

1. **Icon:** changes from circle outline to filled circle + check (above)
2. **Text colour:** changes from `--color-ink` (`#18181b`) to `--color-muted` (`#52525b`)
3. **Text weight:** does NOT change — weight reduction can make text harder to read, especially at small sizes, and the quiet-down is already communicated by colour + icon
4. **Opacity:** does NOT change — full opacity is maintained so the checklist remains fully readable; quieting through opacity on top of colour change would stack two effects and potentially impair readability for low-vision users
5. **Strike-through:** NOT used. Strike-through signals deletion or invalidity. Met rules are complete, not deleted.

What changes is precisely: icon fills + colour dims. Nothing else. The item remains in its position in the list.

The effect: met items look "settled" rather than "done and gone". The eye is naturally pulled to the darker, more prominent unmet items. This serves P3 (draw attention to what remains) without hiding what is already complete.

### 3.4 Rule order in the list

**[USER OVERRIDE — PRD US-5 2026-05-26]** Five rules, new order below. caseMix split. Symbol required and placed last.

Ordered from most-likely-to-be-met-first to least, to give users early positive reinforcement:

1. At least 8 characters *(threshold changed)*
2. Uppercase letter *(split from caseMix)*
3. Lowercase letter *(split from caseMix)*
4. At least one number
5. Special character *(promoted from optional; placed last as it requires shift key / mobile extra taps)*

Rationale: same principle as before — length first (lights up fast), then the character-class rules in the order users typically think about them. Special character last because it still requires the most deliberate intent on mobile, even though it's now mandatory.

### 3.5 Checklist typography

| Property | Value |
|----------|-------|
| Font size | 14px (`--text-sm` equivalent — see Section 4) |
| Font weight | 400 (regular) |
| Line height | 20px (1.43 ratio — comfortable for scanning) |
| Unmet text colour | `--color-ink` `#18181b` |
| Met text colour | `--color-muted` `#52525b` |

### 3.6 Recovery animation hint for motion-designer

When a rule was met and the user backspaces past the threshold (e.g., deletes below 10 characters), the item transitions from met (quieted) back to unmet (prominent). This is a regression state. The design intent:
- Do NOT flash or shake the item — that reads as alarming (violates P4)
- The icon reverts from filled check to outline circle
- Colour reverts from muted to ink
- This transition should be gentle (crossfade), slightly slower than the forward transition — a subtle "uh oh" without drama

---

## 4. Typography

### 4.1 Type stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

This matches the existing `src/index.css` stack already in the project. No new font import required.

### 4.2 Type scale for this component

| Element | Size | Weight | Line-height | Colour (default) |
|---------|------|--------|-------------|-----------------|
| Field label | 14px | 500 (medium) | 20px | `--color-heading` `#4a4a4a` |
| Password input | 16px | 400 | 24px | `--color-ink` `#18181b` |
| Show/hide toggle label (sr-only) | 14px | 400 | 20px | N/A (screen-reader only) |
| Meter tier label | 13px | 500 (medium) | 18px | See Section 5 — tier-specific |
| Checklist item | 14px | 400 | 20px | `--color-ink` / `--color-muted` (met) |
| Checklist item (bonus) | 14px | 400 | 20px | `--color-muted` (always slightly softer) |
| Error message | 14px | 400 | 20px | `--color-ink` `#18181b` |
| Helper text (above field) | 14px | 400 | 20px | `--color-muted` `#52525b` |

Input uses 16px to prevent iOS Safari from zooming in on focus (iOS zooms when input font-size < 16px — this is a mobile accessibility requirement, not a preference). All other copy at 14px.

The meter label is 13px, one step smaller than the checklist text — it reads as a badge/caption, not a headline.

### 4.3 No custom type scale tokens needed

The component uses platform-inherited sizing. If the platform does not yet have named `--text-sm`, `--text-base` tokens, the builder should use the pixel values directly and document them as candidates for future token promotion.

---

## 5. Colour Palette (Complete)

### 5.1 Inherited tokens (use as-is)

| Token | Hex | Use in this component |
|-------|-----|----------------------|
| `--color-accent` | `#378BDA` | Focus ring on the field |
| `--color-accent-soft` | `#E8F0FA` | Focus ring fill / inner glow |
| `--color-ink` | `#18181b` | Primary text: unmet rule items, error text, input value |
| `--color-heading` | `#4a4a4a` | Field label text |
| `--color-muted` | `#52525b` | Helper text, met rule items, bonus rule text |
| `--color-line` | `#e4e4e7` | Input default border |
| `--color-line-strong` | `#d4d4d8` | Input border on hover (subtle reinforcement) |
| `--color-bg` | `#f4f4f5` | Page background — contrast reference |
| `--color-card` | `#FFFFFF` | Card background — contrast reference |
| `--color-disabled` | `#C8C5BD` | Not used directly in this component |

### 5.2 Purpose-designed tokens — **[UPDATED — two-state rewrite 2026-05-26]**

**Active tokens (two-state model):**

| Token name | Hex | Purpose |
|------------|-----|---------|
| `--color-meter-track` | `#929292` | Inactive meter segment fill (unchanged) |
| `--color-meter-progress-fill` | `#3f3f3f` | **NEW** Grey filled progress — 3.38:1 vs track; 10.53:1 vs white (non-text pass) |
| `--color-meter-strong-fill` | `#1E7A3A` | **NEW (replaces blue)** Forest green — all-rules-met state; 5.38:1 vs white (non-text pass) |
| `--color-meter-strong-text` | `#0E5128` | **NEW (replaces #0F4A80)** Deep green label — 9.43:1 vs white (AAA text, 7:1 requirement) |
| `--color-meter-good-text` | `#16548E` | Retained for met checklist icon colour only (not a meter label token) |
| `--color-field-focus` | `#1E5FA8` | Field border on focus (unchanged) |
| `--color-field-error` | `#8B4513` | Field border on server error (unchanged) |

**Weak label text:** Uses `--color-muted` (#52525b) — no new token. 7.64:1 vs white (AAA). The neutral grey communicates "not yet Strong" without alarm.

**Deprecated tokens (superseded — four-tier amber/blue system):**

| ~~Token~~ | ~~Hex~~ | ~~Purpose~~ |
|-----------|---------|-------------|
| ~~`--color-meter-weak-fill`~~ | ~~`#A66C25`~~ | ~~Weak tier amber~~ |
| ~~`--color-meter-fair-fill`~~ | ~~`#B37726`~~ | ~~Fair tier amber~~ |
| ~~`--color-meter-good-fill`~~ | ~~`#2878C8`~~ | ~~Good tier blue~~ |
| ~~`--color-meter-strong-fill`~~ | ~~`#1558A0`~~ | ~~Strong tier blue (was --color-meter-strong-fill)~~ |
| ~~`--color-meter-weak-text`~~ | ~~`#6F4A1C`~~ | ~~Weak/Fair amber label text~~ |
| ~~`--color-meter-strong-text`~~ | ~~`#0F4A80`~~ | ~~Strong blue label text (replaced by deep green)~~ |

### 5.3 Contrast ratio verification table — **[UPDATED — two-state rewrite 2026-05-26]**

All combinations verified using WCAG 2.2 relative luminance formula.

**Meter fill vs backgrounds — ACTIVE (two-state model):**

| Colour | Hex | vs `#FFFFFF` | vs `#F4F4F5` | Pass? |
|--------|-----|------------|------------|-------|
| Meter track (inactive) | `#929292` | 3.11:1 | — | Pass vs white (on card); track is informational, not a UI boundary |
| Progress fill (grey) | `#3f3f3f` | 10.53:1 | — | Pass (well above 3:1 non-text) |
| Progress vs track | `#3f3f3f` vs `#929292` | 3.38:1 | — | Pass — active vs inactive distinction ≥3:1 |
| Strong fill (green) | `#1E7A3A` | 5.38:1 | 4.90:1 | Pass both (≥3:1 non-text minimum) |

**Meter label text vs backgrounds — ACTIVE:**

| Colour | Hex | vs `#FFFFFF` | vs `#F4F4F5` | Pass? |
|--------|-----|------------|------------|-------|
| Weak label (`--color-muted`) | `#52525b` | 7.64:1 | 6.95:1 | AAA vs white; AA+ vs page bg |
| Strong label text | `#0E5128` | 9.43:1 | 8.58:1 | AAA both (deep green) |

**Deprecated — four-tier (superseded 2026-05-26):**

| ~~Colour~~ | ~~Hex~~ | ~~vs `#FFFFFF`~~ | ~~Pass?~~ |
|------------|---------|-----------------|----------|
| ~~Weak fill~~ | ~~`#A66C25`~~ | ~~4.38:1~~ | ~~Pass~~ |
| ~~Fair fill~~ | ~~`#B37726`~~ | ~~3.76:1~~ | ~~Pass~~ |
| ~~Good fill~~ | ~~`#2878C8`~~ | ~~4.55:1~~ | ~~Pass~~ |
| ~~Strong fill~~ | ~~`#1558A0`~~ | ~~7.15:1~~ | ~~Pass~~ |
| ~~Weak/Fair text~~ | ~~`#6F4A1C`~~ | ~~7.86:1~~ | ~~AAA~~ |
| ~~Good text~~ | ~~`#16548E`~~ | ~~7.80:1~~ | ~~AAA~~ |
| ~~Strong text~~ | ~~`#0F4A80`~~ | ~~9.08:1~~ | ~~AAA~~ |

**Checklist + general text vs backgrounds:**

| Colour | Hex | vs `#FFFFFF` | vs `#F4F4F5` | Pass? |
|--------|-----|------------|------------|-------|
| Ink (unmet text) | `#18181b` | 17.72:1 | 16.12:1 | AAA both |
| Muted (met text) | `#52525b` | 7.64:1 | 6.95:1 | AAA vs white; AA+ vs page bg |
| Heading (label) | `#4a4a4a` | 8.43:1 | 7.67:1 | AAA both |

**Field border vs backgrounds:**

| Colour | Hex | vs `#FFFFFF` | Use |
|--------|-----|------------|-----|
| Default border | `#e4e4e7` | 1.27:1 | Decorative structural — the field's shape is communicated by the entire input area, not the border colour alone |
| Focus border | `#1E5FA8` | 6.23:1 | Visible focus indicator — passes WCAG 2.4.11 (AA) and approaches AAA |
| Error border | `#8B4513` | 5.27:1 | Passes AA for non-text contrast |

### 5.4 High contrast mode / forced colours

All meter segments must use `forced-color-adjust: none` or use `currentColor` with a background that respects `ButtonFace`/`ButtonText` in Windows High Contrast Mode. The builder should test this and document the approach. Design intent: in forced colours, the segments should remain visible as distinct shapes. If colour is stripped, segment count still communicates tier.

---

## 6. The Password Field

### 6.1 Field dimensions

- Height: 44px minimum (WCAG 2.5.5 touch target — also a comfortable tap target)
- Recommended: 48px on mobile to give the inner text room to breathe
- Border radius: `--radius-md` (9px from platform tokens)
- Full width behaviour: see Section 1.4

### 6.2 Border colour states

| State | Border | Additional treatment |
|-------|--------|---------------------|
| Default | `--color-line` `#e4e4e7` | 1px solid |
| Hover (pointer devices) | `--color-line-strong` `#d4d4d8` | 1px solid — subtle tightening |
| Focus | `--color-field-focus` `#1E5FA8` | 2px solid; + outer focus ring (see below) |
| Error (server) | `--color-field-error` `#8B4513` | 2px solid |
| Disabled | `--color-line` `#e4e4e7` | 1px solid; input bg: `--color-bg` |

No "success" or "valid" border state on the field itself. Strength feedback lives in the meter and checklist — the field border does not change colour when rules are met. This avoids a double signal and keeps the field visually stable.

### 6.3 Focus ring

The focus ring is separate from the border:
- Style: `outline: 2px solid #1E5FA8; outline-offset: 2px`
- This provides a 2px visible ring outside the field boundary
- Contrast: `#1E5FA8` vs `#FFFFFF` = 6.23:1, vs `#F4F4F5` = 5.67:1 — passes WCAG 2.4.11 and WCAG 2.4.7
- The outline must not be removed with `outline: none` — only replace it with an equivalent or better focus indicator

### 6.4 Show/hide toggle

**Position:** Inside the field, right-aligned. Top and bottom padding matches field padding so the icon is vertically centred.

**Dimensions:**
- Visible icon: 20px × 20px (eye/eye-slash SVG or equivalent)
- Minimum interactive target: 44px × 44px
- Implementation: the button wrapping the icon is `width: 44px; height: 44px` — the field padding on the right accommodates this (right padding on input = 48px to clear the toggle)

**Icon style:** Simple outlined eye icon for "hidden" state; eye with slash for "visible" state. The icon can be from any standard icon set (Heroicons, Feather, Lucide, etc.) as long as:
- Stroke weight is 1.5–2px (too thin is illegible; too heavy looks heavy-handed)
- The icon colour is `--color-muted` (`#52525b`) in default state, `--color-ink` (`#18181b`) on hover/focus of the toggle

**Accessible label (required):**
- When password is hidden: `aria-label="Show password"`
- When password is visible: `aria-label="Hide password"`
- The `type` attribute changes: `type="password"` ↔ `type="text"`
- The icon change alone is not sufficient — label must change programmatically

**Default state by context:**

| Context | Mobile default | Desktop default |
|---------|--------------|----------------|
| Registration | `type="text"` (revealed) | `type="password"` (masked) |
| Reset | `type="text"` (revealed) | `type="password"` (masked) |
| Settings | `type="password"` (masked) | `type="password"` (masked) |

Settings is always masked by default. The user is changing a known password in a deliberate settings flow — the shoulder-surfing risk calculation is different from a distracted mobile registration. Reset mirrors registration (same primary persona, same device mix).

**Simultaneous reveal:** When a "confirm password" field is present, the show/hide toggle on the primary field reveals both fields simultaneously (see strategy 5.3). Design implementation: a single `isRevealed` state controls both `type` attributes. The confirm field has no separate toggle — it follows the primary field. This reduces tap count on mobile when the confirm field is scrolled out of view.

**User override 2026-05-26:** Confirm password field has been removed across all contexts. The toggle now controls only the one password field. The "simultaneous reveal" note above is obsolete — retained for historical context only.

---

## 7. Error State

**[USER OVERRIDE — PRD US-5 2026-05-26]** Three new error/feedback surfaces added. See §7.5 for the PRD US-5 additions.

### 7.1 Scope — what counts as an error here

This component deliberately does not use error states for unmet rules. Unmet rules are guidance (the checklist). An error only occurs when something external goes wrong — the component has done its job, the user has submitted, and the server has rejected for a reason outside the local rules.

**Guidance state (not an error):** Rule unmet. Shown by checklist icon + prominence. No error colour, no error label.

**True error (API rejection):** Server rejects the password for a reason outside the visible rules (e.g., password reused, password matches account username, API validation failure).

~~One additional edge case: the user attempts to submit with a password below the Good threshold. This should not reach the API — the submit button is disabled at that point.~~ **[OVERRIDE — PRD US-5]** Submit is no longer tier-gated. The button is always tappable. The field-level error slot handles the feedback when rules are unmet. See §7.5.

### 7.2 Error anatomy (server rejection)

```
┌───────────────────────────────────────────┐
│ ●●●●●●●●        [eye icon]                │  ← field with error border (#8B4513, 2px)
└───────────────────────────────────────────┘
  [!]  Something went wrong. Try a different password.
```

- Error border: 2px solid `#8B4513` (amber-brown, not red)
- Error text: sits immediately below the field, above the meter row
- Error icon: filled circle with `!` inside, `#8B4513`, 16px × 16px
- Error text colour: `--color-ink` `#18181b` — the icon carries the semantic colour signal; the text is neutral ink so it is maximally readable
- Error text size: 14px / 400 / 20px line-height (matches helper text)
- Error text position: `--space-sm` (8px) below field border, `--space-md` (12px) above meter row

If an error is shown, the meter and checklist remain visible and functional. The user can keep typing to correct the issue. The error message clears when the user starts typing again (on first keystroke after error state).

### 7.3 Error copy hooks

The component provides a slot for error text. Copy is the content-writer's domain, but the slot handles:
- A single sentence (no line breaks, no list)
- Forward-facing: what to do, not what went wrong
- Maximum ~80 characters to stay on one line at 375px

Content-writer: the brief copy direction is "Something went wrong. Try a different password." — your task is to refine or validate this wording. The visual slot is one sentence, below the field.

### 7.4 No inline error state per checklist item

Checklist items do not enter an error state. An unmet mandatory rule is always "not yet" — never "wrong". The field-level error slot (§7.5) is the surface that signals "you need to do something to proceed" — the checklist stays as guidance only.

### 7.5 Three messaging surfaces — PRD US-5 additions

**[NEW — PRD US-5 2026-05-26]**

Three distinct DOM slots, three distinct jobs:

**Slot 1 — Live checklist** (always visible)
- Existing behaviour, updated rule set. Neutral teaching tone. No change to job.

**Slot 2 — Inline rejection notice** (new)
- DOM position: below the meter row, above the checklist
- Trigger: blacklist check returns `rejected`
- Visual: amber-brown text (`--color-field-error`), info-style circle icon (not filled/alarming), subtle background tint
- Copy: `"This password is too common — please choose another."`
- Disappears when: password changes and check returns `accepted`, or field clears

**Slot 3 — Field-level error** (new)
- DOM position: below the input underline, above the meter
- Trigger: Next tapped when field is empty or first rule unmet
- `role="alert"` — announced immediately by screen reader
- Clears: on next keystroke (any keystroke)
- Does NOT stack with the rejection notice — if blacklist rejected, Next tap refocuses without adding a field error
- Copy is action-oriented ("Add an uppercase letter to continue.") — not a checklist item, a direction

**What was removed:** F2 gate message, F7 bridging hint, B4 dedup logic. The field-level error and inline rejection notice replace all gate messaging patterns.

---

## 8. The Three Contexts

**User override 2026-05-26:** Confirm password field removed across all contexts. The table below in 8.1 no longer reflects the component's actual behaviour for confirm field presence — it is retained as a historical record.

### 8.1 What changes between contexts (visual only)

Per P5 and the strategy: the component is one implementation. Context changes copy only. No layout, no colour, no behaviour changes.

| Element | Registration | Reset | Settings |
|---------|-------------|-------|----------|
| Field label | "Create a password" | "New password" | "New password" |
| Helper text | See content-writer | See content-writer | See content-writer |
| Current password field above | No | No | Yes (separate field — outside this component's scope) |
| Show/hide default (mobile) | Revealed | Revealed | Masked |
| Show/hide default (desktop) | Masked | Masked | Masked |
| Form context visual additions | None | One added element (see 8.2) | None |
| Error copy | See content-writer | See content-writer | See content-writer |

### 8.2 Reset context: one additional visual element

The reset flow carries higher emotional load. One additional, visually distinct element is warranted — but minimal.

**What:** A single line of helper text in a lightly tinted surface box, sitting above the field, below the helper text line:

```
┌─────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│    [ℹ] Your new password works immediately.   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────────────┘
```

- Background: `--color-accent-soft` `#E8F0FA` — the platform's blue-tinted surface, calm and informational
- Border radius: `--radius-sm` (6px)
- Padding: `--space-sm` (8px) vertical, `--space-lg` (16px) horizontal
- Icon: small info circle `ℹ`, 14px, `--color-accent` `#378BDA`
- Text: 14px / 400 / `--color-ink` — content-writer provides the exact phrase
- Position: between the helper text and the field input
- Purpose: reassures the locked-out user that the action will work without dwelling on the reason they're here

This element appears only in the `context="reset"` render. It is NOT an error state — it uses the accent-soft blue surface, not any error colour.

### 8.3 Settings context: no additional visual elements

The settings flow is lower stakes. No additional visual treatment. The "current password" field above is handled by the surrounding form, not this component.

---

## 9. Spacing and Layout Tokens — Full Reference

```
Component layout — vertical rhythm:

  0px   Field label
  20px  ↓ label bottom margin (--space-xl)
  0px   Input field (48px height on mobile, 44px min)
  12px  ↓ (--space-md)
  0px   Meter row
  16px  ↓ (--space-lg)
  0px   Checklist item 1
  10px  ↓ (--space-checklist-item — new)
  0px   Checklist item 2
  10px  ↓
  0px   Checklist item 3
  10px  ↓
  0px   Checklist item 4 (bonus)

Meter row internal:
  [bar]  6px gap  [label text]
  Gap = --space-meter-label (new, 6px)

Checklist item internal:
  [16px icon]  8px gap  [text]
  Icon area including padding: 20px × 20px

Field internal spacing:
  Left padding:  --space-lg (16px)
  Right padding: 48px (clears the 44px toggle)
  Top/bottom padding: auto — field height is fixed, content centred vertically

Toggle button:
  Width: 44px
  Height: 44px
  Position: absolute, right: 0, top: 50%, transform: translateY(-50%)
  Icon: centred within 44×44 area
```

---

## 10. Responsive Behaviour

### Mobile (< 480px)
All decisions above are the mobile baseline. Notable:
- Input font-size: 16px (prevents iOS zoom)
- Show/hide toggle: 44px target, inside the field right edge
- Password revealed by default on first render (registration/reset contexts)
- Checklist items: 14px text, 10px gap, fully stacked

### Tablet (480px–767px)
- Component max-width: 480px
- All proportions identical to mobile — no layout changes at this breakpoint for this component
- Show/hide default: still revealed (still primarily touch/mobile at this viewport size)

### Desktop (≥ 768px)
- Component max-width: 480px, left-aligned in form
- Password masked by default (registration/reset contexts)
- Hover states active: field border tightens on hover (`--color-line-strong`), toggle icon darkens on hover
- No other layout changes — the component does not spread wider at desktop

---

## 11. ASCII Layout — Complete Component (Mobile, Fair state, two rules met)

```
  Create a password
  ┌──────────────────────────────────┐
  │ ●●●●●●●●●●●                [👁] │  ← type="text" (revealed, mobile)
  └──────────────────────────────────┘

  ■ ■ □ □  Fair                          ← 2 amber segments + "Fair" in #6F4A1C

  ✓ At least 10 characters               ← icon filled #16548E, text muted #52525b
  ○ Uppercase and lowercase              ← icon outline #52525b, text ink #18181b
  ○ At least one number                  ← icon outline, text ink
  + A symbol adds strength               ← + icon outline, text muted always
```

```
  Create a password
  ┌──────────────────────────────────┐
  │ ●●●●●●●●●●●                [👁] │
  └──────────────────────────────────┘

  ■ ■ ■ ■  Strong                        ← 4 blue segments + "Strong" in #0F4A80

  ✓ At least 10 characters               ← all muted
  ✓ Uppercase and lowercase
  ✓ At least one number
  + A symbol adds strength               ← unmet bonus stays muted, no check
```

---

## 12. Accessibility Checklist — Pre-handoff Verification

| Requirement | Decision made | Verified? |
|-------------|--------------|-----------|
| Contrast: all label text AAA (7:1) on white | Met — Section 5.3 | Yes — computed |
| Contrast: all label text AAA (7:1) on page bg | Met — Section 5.3 | Yes — computed |
| Contrast: meter fills non-text 3:1 | Met — Section 5.3 | Yes — computed |
| Touch target: show/hide toggle 44×44px | Met — Section 6.4 | Specified |
| Touch target: checklist items not interactive | Met — Section 3.1 | Specified |
| Focus indicator: visible, not outline:none | Met — Section 6.3 | Specified |
| Colour not sole indicator: met/unmet rules | Met — icon shape changes + colour | Specified |
| Colour not sole indicator: meter tier | Met — segment count + label text | Specified |
| Screen reader: live region for tier label | For motion-designer to implement | Noted in strategy |
| Screen reader: checklist announcements | For motion-designer to implement | Noted in strategy |
| 200% zoom: layout holds | Component width is flexible; no fixed pixel widths except max-width | Specified |
| iOS zoom prevention: input 16px | Met — Section 4.2 | Specified |
| Password pasting: not blocked | Not a visual decision — builder must confirm no paste listener | Flagged |
| prefers-reduced-motion: no essential motion | All transitions are enhancement — defer to motion-designer | Flagged |

---

## 13. Open Questions (Carry Forward)

1. **Reset context helper text copy:** Content-writer to provide the exact phrase for the blue info box in reset context. Visual slot is defined; copy is not.
2. **Confirm password field toggle:** Does the confirm field share the single toggle, or does the parent form provide its own separate toggle? This component exposes a callback (`onRevealChange`) for parent coordination — builder to confirm interface.
3. **Forced-colours implementation:** Builder to test `forced-color-adjust` approach for meter segments in Windows High Contrast mode. Design intent is documented (Section 5.4); implementation is builder's decision.
4. **Current password contrast check:** The settings context adds a "current password" field above — that field is outside this component's scope but should use the same token set and field specification. Confirm with the builder that the parent form's current-password field matches these visual decisions.
