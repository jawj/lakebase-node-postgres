/**
 * In this version, we get an auth on startup and refresh it in the background,
 * regardless of usage. We make use of node-postgres' support for passing a 
 * function to the `password` config option.
 */

import 'dotenv/config';
import { Client } from 'pg';

// the key bit happens in this imported function, but now we add caching on top
import { getClientCredentials } from './getClientCredentials.js';

async function eagerlyRefreshedCredentials(asyncRefreshFn) {
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

// must use the same returned function in every loop iteration
const cachedCredentialFn = await eagerlyRefreshedCredentials(getClientCredentials);
const repeatMinutes = 10;

while (true) {
  const client = new Client({ password: cachedCredentialFn });

  process.stdout.write('Connecting ...\n');
  await client.connect();

  process.stdout.write('Querying ...\n');
  const { rows: [{ now }] } = await client.query('SELECT now()');

  process.stdout.write(`Done. The time is: ${now.toISOString()}.\n`);
  client.end();

  process.stdout.write(`Waiting ${repeatMinutes} minutes ...\n`);
  await new Promise(resolve => setTimeout(resolve, repeatMinutes * 60000));
}
