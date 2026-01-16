/**
 * There's no caching of auth tokens in this simple version, which is
 * appropriate for a one-shot script.
 */

import 'dotenv/config'; // load .env file into process.env
import { Client } from 'pg';

// the important bit happens in this imported function
import { getClientCredentials } from './getClientCredentials.js';

process.stdout.write('Getting auth token ...\n');
const { access_token } = await getClientCredentials();
const client = new Client({ password: access_token });

process.stdout.write('Connecting ...\n');
await client.connect();

process.stdout.write('Querying ...\n');
const { rows: [{ now }] } = await client.query('SELECT now()');

process.stdout.write(`Done. The time is: ${now.toISOString()}.\n`);
client.end();
