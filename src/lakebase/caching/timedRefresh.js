/**
 * Returns a function that provides credentials which are eagerly refreshed
 * in the background before they expire
 * @param {() => Promise<{ token: string; expires: Date; }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @param {number} earlyRefreshSeconds
 * How far ahead of the expiry time to try renewing credentials
 * @returns {Promise<() => string>}
 * A function that returns the cached token
 */
export async function cachedWithTimedRefresh(asyncRefreshFn, earlyRefreshSeconds = 180) {
  let cachedToken = '';

  async function refreshToken() {
    console.info('Refreshing auth token ...');
    const { token, expires } = await asyncRefreshFn();
    cachedToken = token;
    const refreshAfterMs = expires.getTime() - Date.now() - 1000 * earlyRefreshSeconds;
    setTimeout(refreshToken, refreshAfterMs);
  }
  
  await refreshToken();
  return () => cachedToken;
}
