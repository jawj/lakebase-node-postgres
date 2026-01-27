/**
 * Returns an async function that fetches new credentials each time, and simply
 * picks out the access_token field
 * @param {() => Promise<{ access_token: string }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {() => Promise<string>}
 * A function that provides the cached token
 */
export function uncachedCredentials(asyncRefreshFn) {
  return async function () {
    const token = await asyncRefreshFn();
    const { access_token } = token;
    return access_token;
  };
}
