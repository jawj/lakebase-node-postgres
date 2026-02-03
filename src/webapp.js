/**
 * This basic web app shows how to use Lakebase with the 3 major JS drivers:
 * 
 * - node-postgres (`import 'pg'`)
 * - postgres.js (`import 'postgres'`)
 * - Bun.SQL
 * 
 * You will normally pick only one of these, of course!
 * 
 * For a web app of this sort the timedRefreshConfig is most suitable, since
 * by eagerly refreshing Lakebase credentials on a schedule it minimises worst-
 * case response latency.
 */


// --- common Postgres setup ---

import { timedRefreshConfig } from './lakebase/pgConfig.js';
const pgConfig = await timedRefreshConfig();


// --- web app setup

import { Hono } from 'hono';
import { logger } from 'hono/logger';

const app = new Hono();
app.use(logger());

const port = Number(process.env.HTTP_PORT || 8543);
if (typeof Bun !== 'undefined') Bun.serve({ port, fetch: app.fetch });
else if (typeof Deno !== 'undefined') Deno.serve({ port }, app.fetch);
else (await import('@hono/node-server')).serve({ port, fetch: app.fetch });

app.get('/', (ctx) =>
  ctx.html(`<!DOCTYPE html><title>Lakebase Postgres auth examples</title>
    <ul>
      <li><a href="/node-postgres">node-postgres</a>
      <li><a href="/postgres.js">postgres.js</a>
      <li><a href="/Bun.SQL">Bun.SQL</a>
    </ul>`)
);

/**
 * @param {string} driver 
 * @param {Date} date 
 */
const page = (driver, date) => `<!DOCTYPE html><title>${driver} example</title><p>${driver}: ${date.toISOString()}</p>`;


// --- node-postgres example ---

import { Pool } from 'pg';

const pool = new Pool({
  ...pgConfig,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
  max: 10,
});

// surface errors on idle clients, which include scale-to-zero events, and continue
pool.on('error', (err, client) => console.warn(`Postgres error on idle client: ${err.message}`));

app.get('/node-postgres', async (ctx) => {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  return ctx.html(page('node-postgres', now));
});


// --- postgres.js example ---

import postgres from 'postgres';

const sql = postgres({
  ...pgConfig,
  connect_timeout: 10,
  idle_timeout: 270, // suggested: slightly shorter than your scale-to-zero time
  max: 10,
});

app.get('/postgres.js', async (ctx) => {
  const [{ now }] = await sql`SELECT now()`;
  return ctx.html(page('postgres.js', now));
});


// --- Bun.SQL example (only if we're running on Bun) ---

if (typeof Bun !== 'undefined') {
  const sql = new Bun.SQL({
    ...pgConfig,
    ssl: {
      ...pgConfig.ssl,
      serverName: pgConfig.host, // see https://github.com/oven-sh/bun/issues/26369
    },
    connectionTimeout: 10,
    idleTimeout: 270, // suggested: slightly shorter than your scale-to-zero time
    max: 10, // note: Bun connects these clients all at once on startup
  });

  app.get('Bun.SQL', async (ctx) => {
    const [{ now }] = await sql`SELECT now()`;
    return ctx.html(page('Bun.SQL', now));
  });
}
