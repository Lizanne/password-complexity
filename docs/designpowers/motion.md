# Motion Specification — Password Complexity
**Agent:** motion-designer
**Date:** 2026-05-26
**Status:** Complete
**Feeds into:** design-builder (implementation), accessibility-reviewer (vestibular and reduced-motion audit)

---

## How to read this document

Every animation is specified with: what changes, which CSS properties move, duration, easing, stagger, and a `prefers-reduced-motion: reduce` alternative. Reduced-motion alternatives are not abbreviated — each one is fully specified.

**Meter bar reference:** 8px tall, 4 segments, 4px gaps, 3px radius. (Design-lead's visual-decisions.md Section 2.2 contains an earlier 6px value — that was overridden by the user. 8px is authoritative.)

**Debounce note:** All meter and checklist state changes fire after the 300ms input debounce resolves. The motion timings below are measured from the moment the debounced state change lands — they do not include debounce time.

**Core easing used throughout:**
- Forward/entry: `cubic-bezier(0.2, 0, 0, 1)` — ease-out character, decelerates into final position. Things arrive and settle.
- Exit/departure: `cubic-bezier(0.4, 0, 1, 1)` — ease-in character, accelerates away cleanly.
- State change (bidirectional): `cubic-bezier(0.4, 0, 0.2, 1)` — ease-in-out, smooth weight shift, no hard start or stop.
- Do not use spring/bounce easings anywhere in this component. This is a security-sensitive form; spring motion reads as playful and is wrong for the tone (P4).

---

## 1. Meter — segment tier change (forward)

**What:** User types past a tier boundary. Inactive segment(s) fill with the new tier colour. Already-lit segments may change colour (e.g., crossing from Fair to Good recolours segments 1 and 2 from amber to blue).

**Properties:**
- New segment fill: `opacity` (0 → 1) + `transform: scaleX()` (0 → 1, origin left edge of each segment)
- Already-lit segment recolour: `background-color` transitions from previous tier fill to new tier fill
- Tier label text: `color` transitions from previous tier text colour to new tier text colour

**Duration:**
- New segment fill animation: 180ms
- Already-lit segment recolour: 180ms (concurrent — runs simultaneously with the fill)
- Tier label colour shift: 180ms (concurrent)

**Easing:**
- Segment fill: `cubic-bezier(0.2, 0, 0, 1)` (ease-out — the segment arrives and lands)
- Segment recolour: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out — a smooth colour weight shift, no hard snap)
- Label colour: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

**Stagger:** None. All changes fire simultaneously. A stagger between "recolour existing segments" and "fill new segment" would imply two events; this is one event (tier change).

**Colour crossfade rationale:** When the user crosses from Fair (amber) to Good (blue), segments 1 and 2 are already lit. Their fill colour must crossfade from `#B37726` to `#2878C8` simultaneously with segment 3 filling. Do not animate this colour change with a spring; ease-in-out is correct here.

**Reduced-motion alternative:**
- All segment fills: instant (no scaleX animation, opacity snaps to 1 with no transition)
- Recolour of existing segments: instant (background-color snaps, no transition)
- Tier label: instant colour change (no transition)
- The state change is still visible — it just happens without movement

---

## 2. Meter — segment tier change (backward / regression)

**What:** User backspaces and crosses a tier boundary downward (e.g., Good → Fair, or Fair → Weak). One segment de-fills; previously lit segments may recolour from blue back to amber.

**Properties:**
- De-filling segment: `opacity` (1 → 0) + `transform: scaleX()` (1 → 0, origin right edge — it retreats from the right)
- Previously lit segment recolour: `background-color` from current tier fill back to lower tier fill
- Tier label text: `color` shifts back

**Duration:**
- De-fill: 240ms (60ms slower than forward fill — this extra time makes regression feel accurate rather than punishing. A 180ms snap backwards reads as abrupt; 240ms reads as measured.)
- Segment recolour: 240ms (concurrent)
- Tier label: 240ms (concurrent)

**Easing:**
- De-fill: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out — no hard acceleration into the retreat)
- Recolour: `cubic-bezier(0.4, 0, 0.2, 1)`
- Label: `cubic-bezier(0.4, 0, 0.2, 1)`

**Stagger:** None. Simultaneous.

**What NOT to do:** Do not flash the de-filling segment. Do not bounce. Do not use a colour that is different from the target tier colour mid-transition. The regression is a clean, calm readout of current state.

**Reduced-motion alternative:**
- All changes instant — segment de-fills with no animation, colour snaps, label snaps
- Same information, no movement

---

## 3. Meter — first appearance (label entry on first keystroke)

**Context:** Before first keystroke, the four inactive segments (grey, `#929292`) are already visible in the meter track — they appear when the field receives focus. The meter track (bar container) fades in on focus (see animation 5). What is *absent* before first keystroke is the tier label text ("Weak" / "Fair" / etc.).

**What:** On first keystroke (after 300ms debounce), the tier label text appears.

**Properties:**
- Label: `opacity` 0 → 1

**Duration:** 200ms

**Easing:** `cubic-bezier(0.2, 0, 0, 1)` (ease-out — arrives and settles)

**Delay:** 0ms from debounce resolution. The segment fills simultaneously (animation 1); the label fades in at the same time.

**What NOT to do:** Do not slide the label in from the side. Do not scale it up from zero. A gentle fade is sufficient and calm. A slide would introduce spatial movement in a component that has no spatial narrative at this point.

**Reduced-motion alternative:**
- Label appears instantly at full opacity when debounce resolves — no transition

---

## 4. Checklist — rule meeting (forward: unmet → met)

**What:** A mandatory rule crosses its threshold. The circle-outline icon transitions to a filled-circle-with-check icon. The rule text colour shifts from ink (`#18181b`) to muted (`#52525b`).

**Two-phase approach:** Yes, two phases — but very close together (not sequential with a noticeable gap).

**Phase 1 — icon fill (0ms–150ms):**
- Icon: `opacity` of the filled state crossfades over the outline state — achieved by layering filled icon over outline icon and fading out the outline (opacity 1 → 0) while fading in the filled state (opacity 0 → 1)
- Checkmark draw: the check mark inside the filled circle fades in (opacity 0 → 1) — do not use a path-drawing stroke-dashoffset animation, as that can cause visual noise at 14px–16px sizes and may be jarring at small scale. Fade is cleaner and calmer.
- Duration: 150ms
- Easing: `cubic-bezier(0.2, 0, 0, 1)` (ease-out)

**Phase 2 — text quieting (50ms delay, 200ms duration):**
- Text colour: `color` from `#18181b` to `#52525b`
- Starts 50ms after Phase 1 begins (not after it ends — slight overlap)
- Duration: 200ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out — a smooth weight shift, the text gently recedes)

**Total perceived duration:** ~250ms from debounce resolution to settled state.

**Rationale for stagger:** The 50ms offset means the icon completes its transformation before the text has fully quieted. The user's eye is drawn to the icon first (the state-change signal), then the text follows. If both happened simultaneously, the icon change and text change compete for attention. The slight offset creates a natural reading sequence: icon (done) → text (settling).

**Reduced-motion alternative:**
- Icon: instant swap — outline icon is replaced by filled icon, no crossfade
- Text colour: instant change from ink to muted
- No transition of any kind — the state change is still visible through the icon and colour change

---

## 5. Checklist — rule breaking (backward: met → unmet)

**What:** User backspaces past a rule threshold (e.g., deletes characters below length 10). A previously met rule reverts to unmet. The filled-circle-check reverts to outline-circle; the muted text colour reverts to ink.

**Properties:**
- Icon: filled-circle-check fades out (opacity 1 → 0), outline-circle fades in (opacity 0 → 1) — same layering approach as forward, reversed
- Text colour: `color` from `#52525b` back to `#18181b`

**Duration:** 280ms for both icon and text (concurrent — no phase stagger on regression)

**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out throughout)

**Delay:** 0ms. No stagger. The item reasserts its prominence as a single, calm movement.

**Rationale:** Regression is slower (280ms) than forward progress (250ms total). The extra time prevents the "snap back to unmet" from reading as an alarm. This is the most delicate animation in the component — the "gentle uh-oh" that design-lead specified. Everything moves together, slowly, in a way that reads as "noting this" rather than "warning you." Do not use a flash, a shake, or any colour that sits outside the amber/blue/ink/muted vocabulary.

**Specifically prohibited:** any red or error-red colour at any point during this transition, even briefly mid-animation. `background-color` should never visit an intermediate colour that is not on the palette.

**Reduced-motion alternative:**
- Instant icon swap (filled+check → outline) and instant colour change (muted → ink)
- No transition

---

## 6. Field — focus / blur

**What:** The field receives keyboard focus. The border transitions from default to focus state and a focus ring appears.

**On focus:**
- Border colour: `border-color` from `#e4e4e7` to `#1E5FA8`, and border-width from 1px to 2px
- Focus ring: `outline` appears — `2px solid #1E5FA8`, `outline-offset: 2px`
- Inactive meter track: `opacity` 0 → 1 (the four grey segments appear when focus lands — see note below)

**Duration:**
- Border colour + width: 150ms
- Focus ring (outline): 120ms (slightly faster — feels snappier, like the field "clicks in")
- Meter track appearance: 200ms, 80ms delay after focus (the track appears a beat after focus, not simultaneously — it follows the field, doesn't compete with it)

**Easing:**
- Border: `cubic-bezier(0.2, 0, 0, 1)` (ease-out)
- Focus ring: `cubic-bezier(0.2, 0, 0, 1)`
- Meter track: `cubic-bezier(0.2, 0, 0, 1)`

**On blur:**
- Border: transitions back to `#e4e4e7` / 1px over 120ms, ease-in `cubic-bezier(0.4, 0, 1, 1)` — it departs
- Focus ring: fades out over 100ms, ease-in
- Meter track: remains visible (the track is persistent once shown — it does not hide on blur)
- Tier label: remains visible once it has appeared

**Note on animating border-width:** Changing border-width from 1px to 2px can cause layout shift if the field uses `box-sizing: content-box` or if the surrounding layout is not flex/grid. Use `outline` for the focus ring (which does not affect layout) and prefer `box-shadow: inset` as an alternative to border-width change if layout shift occurs. The builder should test this and choose the approach that does not shift layout.

**Reduced-motion alternative:**
- Border colour and focus ring: instant on focus, instant on blur (no transition)
- Meter track: instant opacity change on focus (no fade)

---

## 7. Field — error appearance (server-side)

**What:** A server-side rejection returns after form submission. The field border transitions to the amber-brown error colour (`#8B4513`). Error text appears below the field.

**Border transition:**
- `border-color` from current state (focus blue or default grey) to `#8B4513`
- `border-width` to 2px if not already
- Duration: 200ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out — a state change, not an arrival)

**Error text entry:**
- `opacity` 0 → 1
- `transform: translateY(-4px)` → `translateY(0)` (the text slides up 4px and fades in — a small, restrained movement that draws the eye without startling)
- Duration: 220ms
- Easing: `cubic-bezier(0.2, 0, 0, 1)` (ease-out — arrives and settles)
- Delay: 40ms after border transition starts (the border leads; the text follows a beat later)

**P4 compliance:** The 4px translateY is the maximum permitted movement for error text entry in this component. Do not use a slide from 16px, 20px, or any distance that creates a visually dominant entrance. The error should register, not startle. The amber-brown colour (`#8B4513`) is the primary signal; the motion is secondary.

**Error dismissal (on first keystroke after error):**
- Border colour: transitions back to focus state (`#1E5FA8`) over 150ms, ease-in-out
- Error text: `opacity` 1 → 0 over 150ms, ease-in `cubic-bezier(0.4, 0, 1, 1)` — it departs cleanly

**Reduced-motion alternative:**
- Border: instant colour change to `#8B4513`, no transition
- Error text: appears instantly at full opacity, no translateY, no fade
- On dismissal: instant removal (display:none or opacity:0 without transition)

---

## 8. Show/hide toggle press

**What:** User taps the eye/eye-off icon to toggle password visibility.

**Decision: instant icon swap, no animation.**

**Rationale:** The toggle's purpose is to change password visibility — the primary feedback is the field content changing (characters becoming visible or dots reappearing), which is immediate. Adding an icon transition on top of that creates two simultaneous animation events that compete. The icon change itself is a symbol swap, not a state progression; animating a symbol swap at 20px size at 300–400ms would be perceptible but purposeless. Keep it instant.

**What does animate:** The button's interactive focus/hover state — a subtle background-color change on the 44×44px touch target area (from transparent to a low-opacity tint, `--color-accent-soft` at 40% opacity). This confirms the tap was registered.

- Touch/click feedback: `background-color` transparent → `rgba(232, 240, 250, 0.4)` → transparent
- Duration: 80ms in, 160ms out (quick in, slower release — standard button press feel)
- Easing: linear for the press-in (fast tactile confirmation), ease-out for release
- This uses a CSS `:active` state transition, not a keyframe animation

**Reduced-motion alternative:**
- No change needed — the icon swap is already instant. The touch/click background flash is the only motion, and it is so brief (80ms) that it falls below the threshold of concern for vestibular sensitivity. However, for completeness: in reduced-motion mode, remove even the touch-feedback background flash; the icon swap alone is sufficient confirmation.

---

## 9. Reset context info box — entry on mount

**What:** The blue-tinted info box (`--color-accent-soft` `#E8F0FA` background) appears when `context="reset"` renders.

**Decision: fades in on mount, no slide.**

**Properties:**
- `opacity` 0 → 1

**Duration:** 240ms

**Easing:** `cubic-bezier(0.2, 0, 0, 1)` (ease-out)

**Delay:** 80ms after the component mounts (gives the form a moment to settle before the info box draws attention — it reads as the form "noticing" the reset context)

**Rationale:** This box is purely reassuring in character; it should arrive gently. A slide-in from above or below would feel like an alert or notification, which is wrong for a calm, forward-facing reassurance element. A fade reads as "this was always part of the form." No exit animation is needed — this element is present for the life of the reset render.

**Reduced-motion alternative:**
- Box is present at full opacity immediately on mount (no transition, no delay)
- No animation of any kind

---

## 10. Live region debounce — timing relationship

**Confirmation:** The 300ms debounce specified in the strategy governs when the screen reader live region receives its update and when the visual state (meter, checklist) updates. Both wait for the debounce.

**Are motion timings tied to the debounce?** No. They are independent.

**Explanation:**

The debounce is a threshold: state does not change until the user pauses typing for 300ms. Once that threshold fires, two things happen in parallel:
1. The visual animation begins (meter fills, checklist updates) — timing per the specs above
2. The live region text updates — the screen reader will announce when it gets to it (polite)

These serve different audiences. The sighted user sees the animation unfold over 150–280ms. The screen reader user hears the announcement at whatever point the reader's queue gets to it — potentially several seconds later if they are mid-sentence. Tying visual animation duration to the announcement timing would be meaningless and could create incorrect assumptions (e.g., "should I delay the announcement by 180ms to match the animation?"). No — announce immediately when the state fires; animate immediately when the state fires. They run independently.

**One implication for the builder:** do not update the live region text with intermediate animation states. The live region should receive the final tier label ("Fair", "Good", etc.) and final rule state, not incremental updates that track animation progress. Update the DOM state once, at debounce resolution.

---

## 11. Reduced-motion — complete summary

The following table is the authoritative reduced-motion reference. All animations must be wrapped in a `@media (prefers-reduced-motion: reduce)` block or equivalent JS check.

| Animation | Full motion | Reduced-motion alternative |
|-----------|-------------|---------------------------|
| 1. Meter — forward tier change | scaleX fill + colour crossfade, 180ms | Instant state change — opacity snaps, colour snaps |
| 2. Meter — backward tier change | scaleX de-fill + colour crossfade, 240ms | Instant state change |
| 3. Meter label — first appearance | opacity fade, 200ms | Instant appearance |
| 4. Checklist — rule meeting | Two-phase crossfade + text dim, 250ms total | Instant icon swap + instant text colour change |
| 5. Checklist — rule breaking | Concurrent crossfade, 280ms | Instant icon swap + instant text colour change |
| 6. Field focus | Border colour + focus ring, 120–150ms | Instant border colour change, instant focus ring |
| 6. Field blur | Border retreat, 100–120ms | Instant |
| 6. Meter track on focus | opacity fade, 200ms (80ms delay) | Instant appearance |
| 7. Error border appearance | Colour transition, 200ms | Instant border colour change |
| 7. Error text entry | opacity + translateY(−4px→0), 220ms | Instant appearance at position, no translateY |
| 7. Error dismissal | opacity fade, 150ms | Instant removal |
| 8. Toggle press feedback | background flash, 80ms+160ms | No touch-feedback background animation |
| 9. Info box mount | opacity fade, 240ms (80ms delay) | Present at full opacity immediately |

**Implementation note:** `prefers-reduced-motion: reduce` means reduce, not remove. The state changes are still visible — icon swaps, colour changes, and text updates all happen. What is removed is: all transform-based motion, all opacity transitions, all duration > 0ms on properties that involve spatial movement. Instantaneous colour and content changes are safe and should remain.

---

## 12. Performance notes

**GPU-composited (safe to animate freely):**
- `opacity` — compositor thread, no layout, no paint
- `transform: scaleX()` — compositor thread. Origin must be set correctly per segment (left edge for fill, right edge for de-fill)
- `filter` — not used in this spec

**Requires paint (use with care):**
- `background-color` (segment recolour, error border) — triggers repaint, not reflow. Acceptable for this component's scale (4 segments, 1 border). Do not animate background-color on elements that animate at high frequency or on large surfaces.
- `color` (text colour changes) — triggers repaint. Same assessment: acceptable at this scale.
- `border-color` — triggers repaint. Acceptable.

**Avoid entirely (will cause reflow / layout thrash):**
- Do not animate `width`, `height`, `top`, `left`, `margin`, `padding` on any element in this component
- Do not animate `border-width` directly if it causes layout shift — use `box-shadow: inset` as an alternative for the focus border-width change (see animation 6)

**will-change strategy:**
- Do not set `will-change` globally on the component container
- Apply `will-change: transform, opacity` to meter segments only during an active tier transition — set it just before the animation starts (on the debounce callback), remove it after the transition ends (via `transitionend` event). Persistent `will-change` on all four segments wastes GPU memory.
- On mobile, four 8px segments with `will-change` promoted are negligible. On lower-end devices, the promotion and demotion cost is also negligible at this scale.

**Animation frame budget:**
- All animations in this component run at or well under 16ms/frame on mid-range mobile (Moto G series equivalent). The animated surface area is tiny — four 8px segments and small text. No frame budget concern at this scale.

---

## 13. Vestibular risk assessment

**Risk level: low.** This assessment should be confirmed by the accessibility-reviewer.

Reasons for low classification:
- No large-scale spatial movement (no full-page transitions, no parallax, no zoom)
- Maximum `translateY` in the entire spec: 4px (error text entry — animation 7). This is below the threshold for vestibular concern.
- Maximum `scaleX` movement: meter segment fill, within an 8px tall bar. Sub-centimetre movement on any screen.
- No looping animations anywhere in the spec
- No rotation, no 3D transform, no perspective
- No flashing — all transitions are single-fire, directional, and unidirectional mid-transition

**One item to flag for accessibility-reviewer:** The meter tier change on rapid typing could produce multiple segment animations in quick succession if the user types in bursts and the debounce fires repeatedly. Each individual animation is 180–240ms. If four animations fire in rapid succession (Weak → Fair → Good → Strong), the combined visual might be considered busy. The debounce at 300ms means consecutive firings are at minimum 300ms apart, so animations do not overlap. This should be confirmed as acceptable.

**Reduced-motion removes all spatial movement**, so vestibular risk in reduced-motion mode is effectively zero.
