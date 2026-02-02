import { Hono } from 'hono';

import { Pool } from 'pg';
import postgres from 'postgres';

import { fetchApiCredentials } from './credentials/fetchApiCredentials.js';
import { fetchPgCredentials } from './credentials/fetchPgCredentials.js';
import { withRetries } from './support/withRetries.js';
import { cachedWithOnDemandRefresh } from './caching/onDemandRefresh.js';

import {
  oidcUrl,
  pgTokenUrl,
  clientId,
  clientSecret,
  project,
  branch,
  endpoint,
  pgHost,
  pgDb,
} from './support/config.js';

const apiCredentialsFn = () => fetchApiCredentials(oidcUrl, clientId, clientSecret);
const getApiToken = cachedWithOnDemandRefresh(withRetries(apiCredentialsFn));

const fullEndpoint = `projects/${project}/branches/${branch}/endpoints/${endpoint}`;
const pgCredentialsFn = () => fetchPgCredentials(pgTokenUrl, getApiToken, fullEndpoint);
const getPostgresToken = cachedWithOnDemandRefresh(withRetries(pgCredentialsFn));

const postgresCommonParams = {
  host: pgHost,
  database: pgDb,
  username: clientId,
  password: getPostgresToken,
};

const app = new Hono();

// --- node-postgres ---

const pool = new Pool({
  ...postgresCommonParams,
  ssl: { rejectUnauthorized: true },
});
pool.on('error', (err, client) => `Postgres pool error: ${err.message}`);

app.get('/node-postgres', async (ctx) => {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  return ctx.json({ 'node-postgres': now });
});

// --- postgres.js ---

const sql = postgres({
  ...postgresCommonParams,
  ssl: { rejectUnauthorized: true },
});

app.get('/postgres.js', async (ctx) => {
  const [{ now }] = await sql`SELECT now()`;
  return ctx.json({ 'postgres.js': now });
});

// --- Bun.SQL ---

const bunSql = new Bun.SQL({
  ...postgresCommonParams,
  tls: {
    serverName: pgHost, // https://github.com/oven-sh/bun/issues/26369
    rejectUnauthorized: true,
  },
  max: 3, // by default, Bun immediately connects 10 clients
});

app.get('Bun.SQL', async (ctx) => {
  const [{ now }] = await bunSql`SELECT now()`;
  return ctx.json({ 'Bun.SQL': now });
});
