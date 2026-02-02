import { Hono } from 'hono';
import { Pool } from 'pg';
import postgres from 'postgres';
import { onDemandPgConfig, timedRefreshPgConfig } from './lakebase/pgConfig';

const pgConfig = onDemandPgConfig();
const app = new Hono();

app.get('/', ctx => {
  return ctx.html(`<!DOCTYPE html><title>Lakebase Postgres auth examples</title>
    <ul>
      <li><a href="/node-postgres">node-postgres</a>
      <li><a href="/postgres.js">postgres.js</a>
      <li><a href="/Bun.SQL">Bun.SQL</a>
    </ul>`);
});

// --- node-postgres ---

const pool = new Pool({
  ...pgConfig,
  ssl: { rejectUnauthorized: true }, // validate using OS CA certs
  max: 3,
});
pool.on('error', (err, client) => `Postgres pool error: ${err.message}`);

app.get('/node-postgres', async (ctx) => {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  return ctx.html(`<!DOCTYPE html><title>node-postgres auth example</title>
    <p>Time via node-postgres: ${now.toISOString()}</p>`);
});

// --- postgres.js ---

const sql = postgres({
  ...pgConfig,
  ssl: { rejectUnauthorized: true }, // validate using OS CA certs
  max: 3,
});

app.get('/postgres.js', async (ctx) => {
  const [{ now }] = await sql`SELECT now()`;
  return ctx.html(`<!DOCTYPE html><title>postgres.js auth example</title>
    <p>Time via postgres.js: ${now.toISOString()}</p>`);
});

// --- Bun.SQL ---

const bunSql = new Bun.SQL({
  ...pgConfig,
  tls: {
    rejectUnauthorized: true, // validate using OS CA certs
    serverName: pgConfig.host, // see https://github.com/oven-sh/bun/issues/26369
  },
  max: 3, // by default, Bun connects 10 clients IMMEDIATELY
});

app.get('Bun.SQL', async (ctx) => {
  const [{ now }] = await bunSql`SELECT now()`;
  return ctx.html(`<!DOCTYPE html><title>Bun.SQL auth example</title>
    <p>Time via Bun.SQL: ${now.toISOString()}</p>`);
});

export default app;
