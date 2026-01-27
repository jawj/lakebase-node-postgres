/**
 * Returns an async function that provides credentials that are refreshed on
 * demand if close to expiry
 * @param {() => Promise<{ access_token?: string; token?: string; expires_in?: number; expire_time?: string;}>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {() => Promise<string>}
 * A function that provides the cached token
 */
export function lazyRefreshedCredentials(asyncRefreshFn, expiryBufferSeconds = 120) {
  const cache = { expiry: -1, token: '' };

  return async function () {
    if (cache.expiry > performance.now()) {
      console.log('Using cached auth token ...');

    } else {
      console.log('Refreshing auth token ...');
      const { access_token, token, expires_in, expire_time } = await asyncRefreshFn();

      if (access_token) cache.token = access_token;
      else if (token) cache.token = token;
      else throw new Error('No access_token or token field in credentials');
      
      const expiresAfterSecs =
        expires_in ? expires_in :
          expire_time ? (new Date(expire_time).getTime() - Date.now()) * 0.001 :
            3600; // fallback: 1 hour
      cache.expiry = performance.now() + (expiresAfterSecs - expiryBufferSeconds) * 1000;
    }

    return cache.token;
  }
}
