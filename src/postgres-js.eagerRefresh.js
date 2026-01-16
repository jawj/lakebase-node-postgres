/**
 * In this version, we get an auth on startup and refresh it in the background,
 * regardless of usage. We make use of postgres.js' support for passing a
 * function to the `password` config option.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { fetchCredentials } from './credentials/fetchCredentials.js';
import { credentialsEagerlyRefreshed } from './credentials/credentialsEagerlyRefreshed.js';

// don't call credentialsEagerlyRefreshed more than once: we must use the same
// returned function in every loop iteration
const cachedCredentialFn = await credentialsEagerlyRefreshed(fetchCredentials);

const repeatMinutes = 10;
while (true) { // Ctrl-C to exit
  // @ts-ignore: avoid warning over ssl option if type-checking JS
  const sql = postgres({ password: cachedCredentialFn, ssl: process.env.PGSSLMODE });

  process.stdout.write('Connecting, querying ...\n');
  const [{ now }] = await sql`SELECT now()`;

  process.stdout.write(`Done. The time is: ${now.toISOString()}.\n`);
  sql.end();

  process.stdout.write(`Waiting ${repeatMinutes} minutes ...\n`);
  await new Promise(resolve => setTimeout(resolve, repeatMinutes * 60000));
}
