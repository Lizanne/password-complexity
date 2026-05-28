/**
 * Feature flags for the Password Complexity prototype.
 *
 * Each flag gates a chunk of behaviour that can be toggled without code edits
 * beyond changing the value here. Flip and re-test.
 */

export const FEATURES = {
  /**
   * BLACKLIST_CHECK — on-blur blacklist check + "Checking…" button state.
   *
   * When `true`:
   *   - On password field blur (if complexity met + value differs from last
   *     checked + non-empty), fires a call to `src/lib/passwordCheck.js`
   *   - Button enters "Checking…" state during in-flight checks
   *   - Rejected results render the "Not accepted" notice below the checklist
   *   - "Try these" demo chips render below the Next button
   *
   * When `false` (current default):
   *   - No blacklist call ever fires
   *   - Button has only 4 modes: idle / submitting / success (no checking)
   *   - The rejection notice slot is removed from the DOM entirely
   *   - Demo chips section is hidden (preserved in JSX, flag-gated)
   *
   * To re-enable: flip to `true`, then refresh. No other code changes needed.
   * The infrastructure (passwordCheck.js, cache, AbortController, button mode
   * machine) is all preserved.
   */
  BLACKLIST_CHECK: false,
};
