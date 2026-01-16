/**
 * There's no caching of auth tokens in this simple version, which is
 * appropriate for a one-shot script.
 */

import 'dotenv/config'; // load .env file into process.env
import postgres from 'postgres';

// the important bit happens in this imported function
import { fetchCredentials } from './credentials/fetchCredentials.js';

process.stdout.write('Getting auth token ...\n');
const { access_token } = await fetchCredentials();

// @ts-ignore: avoid warning over ssl option if type-checking JS
const sql = postgres({ password: access_token, ssl: process.env.PGSSLMODE });

process.stdout.write('Connecting, querying ...\n');
const [{ now }] = await sql`SELECT now()`;

process.stdout.write(`Done. The time is: ${now.toISOString()}.\n`);
sql.end();
