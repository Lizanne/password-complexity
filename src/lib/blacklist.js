/**
 * blacklist.js — Stubbed password blacklist check (PRD US-5).
 *
 * This is a CLIENT-SIDE STUB only. It simulates a network call to a server-side
 * blocklist service. The stub:
 *   - Compares case-insensitively against a hardcoded list of common passwords
 *   - Simulates ~400ms network latency
 *   - Supports an optional timeoutMs arg (default 1000ms) for testing the
 *     timeout-fallback path
 *
 * IMPORTANT: In production, the check must happen server-side. Client-side blacklists
 * are trivially bypassable — this stub is for UX feedback only. The server must
 * independently validate before account creation.
 *
 * Timeout fallback behaviour (by design):
 *   When status === 'timeout', the client treats it as accepted and allows submission.
 *   The server is the authoritative gate. Do NOT block submission on client timeout.
 *
 * To exercise the timeout path during development: pass timeoutMs=300 (less than
 * the simulated 400ms delay). The stub will resolve timeout before the check completes.
 */

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

/**
 * Simulates a server-side blacklist check with network latency.
 *
 * @param {string} password — The password to check
 * @param {number} [timeoutMs=1000] — Milliseconds before resolving with 'timeout'
 * @returns {Promise<{ status: 'accepted' | 'rejected' | 'timeout', reason?: string }>}
 */
export async function checkBlacklist(password, timeoutMs = 1000) {
  const SIMULATED_DELAY_MS = 400;

  return new Promise((resolve) => {
    // Timeout sentinel — resolves first if delay exceeds timeoutMs
    const timeoutHandle = setTimeout(() => {
      resolve({ status: 'timeout' });
    }, timeoutMs);

    // Simulated server check — resolves after SIMULATED_DELAY_MS
    setTimeout(() => {
      clearTimeout(timeoutHandle);
      const normalised = password.toLowerCase();
      const isCommon = COMMON_PASSWORDS.some(
        (entry) => entry.toLowerCase() === normalised
      );
      resolve(
        isCommon
          ? { status: 'rejected', reason: 'common' }
          : { status: 'accepted' }
      );
    }, SIMULATED_DELAY_MS);
  });
}
