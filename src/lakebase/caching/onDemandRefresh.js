/**
 * Returns an async function that provides credentials that are refreshed on
 * demand if close to expiry
 * @param {() => Promise<{ token: string; expires: Date; }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {() => Promise<string>}
 * A function that provides the cached token
 */
export function cachedWithOnDemandRefresh(asyncRefreshFn, expiryBufferSeconds = 300) {
  let cache = { token: '', refreshAfter: 0 };

  return async function () {
    if (cache.refreshAfter > Date.now()) {
      console.info('Using cached auth token ...');

    } else {
      console.info('Refreshing auth token ...');
      const { token, expires } = await asyncRefreshFn();
      const refreshAfter = expires.getTime() - 1000 * expiryBufferSeconds;
      cache = { token, refreshAfter };
    }

    return cache.token;
  }
}
