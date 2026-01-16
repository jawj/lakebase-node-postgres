
// @ts-ignore: avoid noImplicitAny warning for asyncRefreshFn if type-checking JS
export function credentialsLazilyRefreshed(asyncRefreshFn) {
  const expiryBufferSeconds = 120;
  const cache = { expiry: -1, token: '' };

  return async function () {
    if (cache.expiry > performance.now()) {
      process.stdout.write('Using cached auth token ...\n');

    } else {
      process.stdout.write('Refreshing auth token ...\n');
      const { access_token, expires_in } = await asyncRefreshFn();
      cache.token = access_token;
      cache.expiry = performance.now() + (expires_in - expiryBufferSeconds) * 1000;
    }

    return cache.token;
  }
}
