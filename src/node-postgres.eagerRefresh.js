/**
 * In this version, we get an auth on startup and refresh it in the background,
 * regardless of usage. We make use of node-postgres' support for passing a
 * function to the `password` config option.
 */

import 'dotenv/config';
import { Client } from 'pg';
import { fetchCredentials } from './credentials/fetchCredentials.js';
import { credentialsEagerlyRefreshed } from './credentials/credentialsEagerlyRefreshed.js';

// don't call credentialsEagerlyRefreshed more than once: we must use the same
// returned function in every loop iteration
const cachedCredentialFn = await credentialsEagerlyRefreshed(fetchCredentials);

const repeatMinutes = 10;
while (true) { // Ctrl-C to exit
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
