/**
 * passwordCheck.js — On-blur blacklist check stub (on-blur slice, 2026-05-26).
 *
 * ─── Real API contract (for future wiring — do NOT implement now) ───────────
 *
 * POST /auth/password/check
 * Content-Type: application/json
 * Request:  { "password": "string" }
 * Response (200): { "accepted": true | false, "reason": "blacklisted" | null }
 *
 * Constraints:
 *   - HTTPS only
 *   - Constant-time server responses (prevents timing oracle on the blacklist)
 *   - Per-session rate limit (~10 requests/session) — client must not retry on 429
 *   - Server MUST NOT log the password value in any log, trace, or error report
 *   - Client MUST NOT log the password value (see comment below in mock body)
 *   - AbortSignal must be honoured — if the signal fires, reject with AbortError
 *     and discard the response even if it arrives concurrently
 *
 * ─── Mock note ─────────────────────────────────────────────────────────────
 *
 * This file is a client-side stub only. The mock:
 *   - Uses a 30-password local list (same list from the previous blacklist.js)
 *   - Compares case-insensitively
 *   - Simulates 300ms network latency
 *   - Supports AbortSignal — aborts during the 300ms wait
 *   - Has a 3-second hard timeout cap (never reached in practice with 300ms mock)
 *
 * The local list is preserved intentionally: dev-mode discoverability of the
 * rejection UI depends on being able to type known passwords and see the notice.
 *
 * IMPORTANT (server integration): In production the check MUST happen server-side.
 * Client-side lists are trivially bypassable — this stub is for UX feedback only.
 * The server is the authoritative gate before account creation.
 *
 * ─── Security note ─────────────────────────────────────────────────────────
 * NEVER log the password value. No console.log, no error reporting that includes
 * the password string, no analytics. This is both a security requirement and a
 * GDPR/data-minimisation requirement. If you need to debug this module, log only
 * the result shape ({ accepted, reason }) — never the input.
 */

/* ─── Mock dictionary ─── */
const COMMON_PASSWORDS = [
  '123456',
  '12345678',
  'password',
  'password1',
  'password123',
  'qwerty',
  'qwerty123',
  'abc12345',
  'iloveyou',
  'admin',
  'welcome',
  'monkey',
  'letmein',
  'football',
  'baseball',
  'dragon',
  'sunshine',
  'princess',
  'master',
  'shadow',
  'qazwsx',
  'trustno1',
  'starwars',
  '1qaz2wsx',
  'P@ssw0rd',
  'login',
  'passw0rd',
  'hello123',
  'changeme',
  'test1234',
];

const MOCK_LATENCY_MS = 300;

/**
 * checkPassword — check a password against the blacklist.
 *
 * @param {string} password — The password to check.
 *                            NEVER log this value — see security note above.
 * @param {object} options
 * @param {AbortSignal} [options.signal] — AbortSignal from an AbortController.
 *   If the signal fires during the mock latency window, the promise rejects with
 *   DOMException('aborted', 'AbortError'). The caller must handle AbortError
 *   separately from other errors (AbortError = no state change; other errors =
 *   treat as timeout and allow submission).
 * @param {number} [options.timeoutMs=3000] — Hard cap. If the call takes longer
 *   than this, resolve as if timeout (caller treats timeout as accepted — server
 *   is authoritative). In the mock, 300ms latency always resolves before 3000ms.
 *
 * @returns {Promise<{ accepted: boolean, reason: 'blacklisted' | null }>}
 */
export async function checkPassword(password, { signal, timeoutMs = 3000 } = {}) {
  // NEVER log the password value here or anywhere in this function.

  return new Promise((resolve, reject) => {
    let mockTimer = null;
    let timeoutTimer = null;

    function cleanup() {
      if (mockTimer !== null) clearTimeout(mockTimer);
      if (timeoutTimer !== null) clearTimeout(timeoutTimer);
    }

    // Hard timeout: resolves as { accepted: true } so the caller can proceed.
    // The server is the authoritative gate — a timeout must not block submission.
    timeoutTimer = setTimeout(() => {
      cleanup();
      resolve({ accepted: true, reason: null });
    }, timeoutMs);

    // AbortSignal handler — fires if the controller is aborted before mock resolves.
    if (signal) {
      if (signal.aborted) {
        cleanup();
        reject(new DOMException('aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', () => {
        cleanup();
        reject(new DOMException('aborted', 'AbortError'));
      }, { once: true });
    }

    // Mock latency — simulates a real network call.
    mockTimer = setTimeout(() => {
      cleanup();

      // NEVER log `password` — see security note at top of file.
      const normalised = password.toLowerCase();
      const isBlacklisted = COMMON_PASSWORDS.some(
        (entry) => entry.toLowerCase() === normalised
      );

      if (isBlacklisted) {
        resolve({ accepted: false, reason: 'blacklisted' });
      } else {
        resolve({ accepted: true, reason: null });
      }
    }, MOCK_LATENCY_MS);
  });
}
