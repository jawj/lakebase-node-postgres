const pastEpoch = -Infinity;
const farFutureEpoch = Infinity;

/**
 * Returns an async function that provides a token that's refreshed on demand
 * if close to expiry
 * @param {() => Promise<{ token: string; expires: Date; }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @param {number} earlyRefreshSeconds
 * How far ahead of the expiry time to try renewing credentials
 * @returns {() => Promise<string>}
 * An async function that provides the cached token
 */
export function cachedWithOnDemandRefresh(asyncRefreshFn, earlyRefreshSeconds = 180) {
  let refreshAfter = pastEpoch; // first call must refresh
  let cachedToken = Promise.resolve('');
  
  async function refreshToken() {
    refreshAfter = farFutureEpoch; // no more refreshes until this refresh completes
    const { token, expires } = await asyncRefreshFn();
    refreshAfter = expires.getTime() - 1000 * earlyRefreshSeconds;
    return token;
  }

  return async function () {
    if (Date.now() > refreshAfter) cachedToken = refreshToken();
    return cachedToken;
  }
}
