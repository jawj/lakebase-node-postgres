/**
 * This basic script shows how to use Lakebase with the 3 major JS drivers:
 * 
 * - node-postgres (`import 'pg'`)
 * - postgres.js (`import 'postgres'`)
 * - Bun.SQL
 * 
 * You will normally pick only one of these, of course!
 * 
 * For a background task of this sort the onDemandConfig is most suitable,
 * since query latency is not important and refreshing Lakebase credentials
 * only on demand minimises load on the back-end.
 */


// --- Postgres config setup ---

import { onDemandConfig } from './lakebase/pgConfig.js';
const pgConfig = await onDemandConfig();

const maxIntervalMs = 10 * 60 * 1000;  // up to 10 minutes between queries


// --- node-postgres example ---

import { Pool } from 'pg';

const pool = new Pool({
  ...pgConfig,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
  max: 1, // we know we won't need parallel connections, but a Pool is still helpful
});

// surface errors on idle clients, which include harmless scale-to-zero events, and continue
pool.on('error', (err, _client) => console.warn(`Error emitted by idle Postgres client: ${err.message}`));

(async function query() {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  console.log(`node-postgres: ${now.toISOString()}`);
  setTimeout(query, Math.random() * maxIntervalMs);
})();


// --- postgres.js example ---

import postgres from 'postgres';

const sql = postgres({
  ...pgConfig,
  connect_timeout: 10,
  idle_timeout: 270, // suggested: slightly shorter than your scale-to-zero time
  max: 1, // we know we won't need parallel connections here
});

(async function query() {
  const [{ now }] = await sql`SELECT now()`;
  console.log(`postgres.js: ${now.toISOString()}`);
  setTimeout(query, Math.random() * maxIntervalMs);
})();


// --- Bun.SQL example ---

if (typeof Bun !== 'undefined') {
  const sql = new Bun.SQL({
    ...pgConfig,
    ssl: {
      ...pgConfig.ssl,
      serverName: pgConfig.host, // see https://github.com/oven-sh/bun/issues/26369
    },
    connectionTimeout: 10,
    idleTimeout: 270, // suggested: slightly shorter than your scale-to-zero time
    max: 1, // we know we won't need parallel connections here
  });

  (async function query() {
    const [{ now }] = await sql`SELECT now()`;
    console.log(`Bun.SQL: ${now.toISOString()}`);
    setTimeout(query, Math.random() * maxIntervalMs);
  })();
}
