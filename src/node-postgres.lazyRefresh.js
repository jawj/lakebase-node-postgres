/**
 * In this version, we refresh the auth token on-demand in a long-running
 * script, caching it in memory until just before it expires. We make use of
 * node-postgres' support for passing a function as the `password` option.
 */

import 'dotenv/config';
import { Client } from 'pg';
import { fetchCredentials } from './credentials/fetchCredentials.js';
import { credentialsLazilyRefreshed } from './credentials/credentialsLazilyRefreshed.js';

// don't call credentialsLazilyRefreshed more than once: we must use the same
// returned function in every loop iteration
const cachedCredentialFn = credentialsLazilyRefreshed(fetchCredentials);

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
