/**
 * Returns a function that provides credentials which are eagerly refreshed
 * in the background before they expire
 * @param {() => Promise<{ token: string; expires: Date; }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {Promise<() => string>}
 * Function that returns the cached token
 */
export async function cachedWithTimedRefresh(asyncRefreshFn, expiryBufferSeconds = 300) {
  let cachedToken = '';

  async function refreshToken() {
    console.info('Refreshing auth token ...');
    const { token, expires } = await asyncRefreshFn();
    cachedToken = token;
    const refreshAfterMs = expires.getTime() - Date.now() - 1000 * expiryBufferSeconds;
    setTimeout(refreshToken, refreshAfterMs);
  };
  await refreshToken();

  return () => cachedToken;
}
