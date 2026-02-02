import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { Pool } from 'pg';
import postgres from 'postgres';
import { timedRefreshPgConfig, onDemandPgConfig, uncachedPgConfig } from './lakebase/pgConfig';

const pgConfig = await timedRefreshPgConfig();

const app = new Hono();
app.use(logger());

app.get('/', (ctx) =>
  ctx.html(`<!DOCTYPE html><title>Lakebase Postgres auth examples</title>
    <ul>
      <li><a href="/node-postgres">node-postgres</a>
      <li><a href="/postgres.js">postgres.js</a>
      <li><a href="/Bun.SQL">Bun.SQL</a>
    </ul>`)
);

// --- node-postgres ---

const pool = new Pool(pgConfig);

// don't let a PG disconnection crash the app
pool.on('error', (err, client) => console.warn(`Postgres pool error: ${err.message}`));

app.get('/node-postgres', async (ctx) => {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  return ctx.html(`<!DOCTYPE html><title>node-postgres auth example</title>
    <p>Time via node-postgres: ${now.toISOString()}</p>`);
});

// --- postgres.js ---

const sql = postgres(pgConfig);

app.get('/postgres.js', async (ctx) => {
  const [{ now }] = await sql`SELECT now()`;
  return ctx.html(`<!DOCTYPE html><title>postgres.js auth example</title>
    <p>Time via postgres.js: ${now.toISOString()}</p>`);
});

// --- Bun.SQL ---

const bunSql = new Bun.SQL({
  ...pgConfig,
  ssl: {
    ...pgConfig.ssl,
    serverName: pgConfig.host, // see https://github.com/oven-sh/bun/issues/26369
  },
  max: 3, // note: by default, Bun connects 10 clients eagerly, on startup
});

app.get('Bun.SQL', async (ctx) => {
  const [{ now }] = await bunSql`SELECT now()`;
  return ctx.html(`<!DOCTYPE html><title>Bun.SQL auth example</title>
    <p>Time via Bun.SQL: ${now.toISOString()}</p>`);
});

export default app;
