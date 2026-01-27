/**
 * Returns a function that provides credentials which are eagerly refreshed
 * in the background before they expire
 * @param {() => Promise<{ access_token?: string; token?: string; expires_in?: number; expire_time?: string;}>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {Promise<() => Promise<string>>}
 * Function that returns the cached token
 */
export async function eagerRefreshedCredentials(asyncRefreshFn, expiryBufferSeconds = 120) {
  /**
   * @type {Promise<string>}
   */
  let cachedToken;

  async function refreshToken() {
    console.info('Refreshing auth token ...');
    const { access_token, token, expires_in, expire_time } = await asyncRefreshFn();

    if (access_token) cachedToken = Promise.resolve(access_token);
    else if (token) cachedToken = Promise.resolve(token);
    else throw new Error('No access_token or token field in credentials');

    const expiresAfterSecs =
        expires_in ? expires_in :
          expire_time ? (new Date(expire_time).getTime() - Date.now()) * 0.001 :
            3600; // fallback: 1 hour
    setTimeout(refreshToken, (expiresAfterSecs - expiryBufferSeconds) * 1000);
  };
  await refreshToken();

  return () => cachedToken;
}
