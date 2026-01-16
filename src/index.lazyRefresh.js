/**
 * In this version, we refresh the auth token on-demand in a long-running script,
 * caching it in memory until just before it expires. We make use of node-postgres'
 * support for passing a function to the `password` config option.
 */

import 'dotenv/config';
import { Client } from 'pg';

// the key bit happens in this imported function, but now we add caching on top
import { getClientCredentials } from './getClientCredentials.js';

function onDemandRefreshedCredentials(asyncRefreshFn) {
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

// must use the same returned function in every loop iteration to get caching
const cachedCredentialFn = onDemandRefreshedCredentials(getClientCredentials);
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
