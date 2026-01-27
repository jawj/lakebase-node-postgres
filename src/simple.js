
import 'dotenv/config'; // load .env file into process.env
import postgres from 'postgres';

import { fetchPostgresCredentials } from './credentials/fetchPostgresCredentials.js';
import { fetchAPICredentials } from './credentials/fetchAPICredentials.js';

const { OIDC_URL, PG_TOKEN_URL, CLIENT_ID, CLIENT_SECRET, PG_ENDPOINT, DATABRICKS_USER, PERSONAL_ACCESS_TOKEN, PGSSLMODE } = process.env;
if (!OIDC_URL || !PG_TOKEN_URL || !CLIENT_ID || !CLIENT_SECRET || !PG_ENDPOINT || !DATABRICKS_USER || !PERSONAL_ACCESS_TOKEN || !PGSSLMODE) {
  throw new Error('Please check .env.example for required environment variables');
}

// --- use a service principal to get initial API credentials ---

const APICredentials = await fetchAPICredentials(OIDC_URL, CLIENT_ID, CLIENT_SECRET);


// --- (1) use those API credentials directly with Postgres ---

// @ts-ignore: avoid warning over ssl option if type-checking JS
const sql2 = postgres({
  username: CLIENT_ID,
  password: APICredentials.access_token,
  ssl: PGSSLMODE,
});
console.log('Connecting, querying ...');
const [{ now: now2 }] = await sql2`SELECT now()`;

console.log(`-> The time is: ${now2.toISOString()}.`);
sql2.end();


// --- OR: (2) use those API credentials to get Postgres credentials ---

const credentialsForServicePrincipal = await fetchPostgresCredentials(PG_TOKEN_URL, APICredentials.access_token, PG_ENDPOINT);

// @ts-ignore: avoid warning over ssl option if type-checking JS
const sql = postgres({
  username: CLIENT_ID,
  password: credentialsForServicePrincipal.token,
  ssl: PGSSLMODE,
});
console.log('Connecting, querying ...');
const [{ now }] = await sql`SELECT now()`;

console.log(`-> The time is: ${now.toISOString()}.`);
sql.end();


// --- OR: (3) just use a personal access token directly to get Postgres credentials ---

const credentialsForUser = await fetchPostgresCredentials(PG_TOKEN_URL, PERSONAL_ACCESS_TOKEN, PG_ENDPOINT);

// @ts-ignore: avoid warning over ssl option if type-checking JS
const sql1 = postgres({ 
  username: DATABRICKS_USER,
  password: credentialsForUser.token,
  ssl: PGSSLMODE,
});
console.log('Connecting, querying ...');
const [{ now: now1 }] = await sql1`SELECT now()`;

console.log(`-> The time is: ${now1.toISOString()}.`);
sql1.end();
