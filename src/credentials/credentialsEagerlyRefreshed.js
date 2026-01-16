
// @ts-ignore: avoid noImplicitAny warning for asyncRefreshFn if type-checking JS
export async function credentialsEagerlyRefreshed(asyncRefreshFn) {
  const expiryBufferSeconds = 120;
  let cachedToken = '';

  async function refreshToken() {
    process.stdout.write('Refreshing auth token ...\n');
    const { access_token, expires_in } = await asyncRefreshFn();
    cachedToken = access_token;
    setTimeout(refreshToken, (expires_in - expiryBufferSeconds) * 1000);
  };
  await refreshToken();

  return () => cachedToken;
}
