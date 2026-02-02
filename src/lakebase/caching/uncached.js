/**
 * Returns an async function that fetches new credentials each time and returns
 * the token field
 * @param {() => Promise<{ token: string }>} asyncRefreshFn
 * Async function to fetch new credentials + expiry info
 * @returns {() => Promise<string>}
 * A function that provides the cached token
 */
export function uncached(asyncRefreshFn) {
  return async function () {
    const credentials = await asyncRefreshFn();
    const { token } = credentials;
    return token;
  };
}
