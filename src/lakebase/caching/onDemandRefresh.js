const pastEpoch = -Infinity;
const farFutureEpoch = Infinity;

/**
 * Returns an async function that provides a token that's refreshed on demand
 * if close to expiry
 * @param {() => Promise<{ token: string; expires: Date; }>} asyncRefreshFn
 * Async function to fetch new credentials
 * @param {number} earlyRefreshSeconds How long before expiry to refresh
 * @returns {() => Promise<string>} Async function that provides a cached token
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
