/**
 * This basic web app shows how to use Lakebase Postgres with the 3 major JS
 * drivers:
 * 
 * - node-postgres (`import 'pg'`)
 * - postgres.js (`import 'postgres'`)
 * - Bun.SQL
 * 
 * It also shows the use of drizzle, Prisma and Kysely, all of which connect
 * via node-postgres.
 * 
 * You will normally pick only one of these options, of course!
 * 
 * For a web app of this sort the timedRefreshConfig is most suitable, since
 * by eagerly refreshing Lakebase credentials on a schedule it minimises the
 * worst-case response latency.
 */


// --- Postgres config setup ---

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

console.log(`Listening at http://127.0.0.1:${port}`);

/** @param {string} title @param {string} body */
const html = (title, body) => `<!DOCTYPE html><title>${title} example</title>${body}`;

/** @param {string} driver @param {Date} date */
const page = (driver, date) => html(driver, `<p>${driver}: ${date.toISOString()}</p>`);

const drivers = ['node-postgres', 'postgres.js', 'Bun.SQL', 'drizzle', 'Prisma', 'Kysely'];

// index page
app.get('/', (ctx) =>
  ctx.html(html(
    'Lakebase Postgres auth examples',
    `<ul>${drivers.map((d) => `<li><a href="/${d}">${d}</a>`).join('\n')}</ul>`
  ))
);


// --- node-postgres example ---

import { Pool } from 'pg';

const pool = new Pool({
  ...pgConfig,
  connectionTimeoutMillis: 30000, // default is 0 = no timeout, but 30s matches other drivers' defaults
  idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
  max: 10,
});

// surface errors on idle clients, which include harmless scale-to-zero events, and continue
pool.on('error', (err, _client) => console.warn(`Error emitted by idle Postgres client: ${err.message}`));

app.get('/node-postgres', async (ctx) => {
  const { rows } = await pool.query('SELECT now()');
  const [{ now }] = rows;
  return ctx.html(page('node-postgres', now));
});


// --- postgres.js example ---

import postgres from 'postgres';

const sql = postgres({
  ...pgConfig,
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
    idleTimeout: 270, // suggested: slightly shorter than your scale-to-zero time
    max: 10, // note: Bun connects these clients all at once on startup
  });

  app.get('/Bun.SQL', async (ctx) => {
    const [{ now }] = await sql`SELECT now()`;
    return ctx.html(page('Bun.SQL', now));
  });
}


// --- drizzle ORM example (using node-postgres) ---

import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle({
  connection: { // using node-postgres, thus matches node-postgres config above
    ...pgConfig,
    connectionTimeoutMillis: 30000, // default is 0 = no timeout, but 30s matches other drivers' defaults
    idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
    max: 10,
  }
});

app.get('/drizzle', async (ctx) => {
  /** @type {{ rows: { now: string }[] }} */
  const { rows: [{ now }] } = await db.execute('SELECT now()');
  return ctx.html(page('drizzle', new Date(now)));
});


// --- Prisma example (using node-postgres adapter) ---

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ // using node-postgres, thus matches node-postgres config above
  ...pgConfig,
  connectionTimeoutMillis: 30000, // default is 0 = no timeout, but 30s matches other drivers' defaults
  idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
  max: 10,
});

const prisma = new PrismaClient({ adapter });

app.get('/Prisma', async (ctx) => {
  /** @type {{ now: Date }[] } */
  const [{ now }] = await prisma.$queryRaw`SELECT now()`;
  return ctx.html(page('Prisma', now));
});


// --- Kysely example (using node-postgres) ---

// we reuse the node-postgres pool from above:

/*
import { Pool } from 'pg';

const pool = new Pool({
  ...pgConfig,
  connectionTimeoutMillis: 30000, // default is 0 = no timeout, but 30s matches other drivers' defaults
  idleTimeoutMillis: 270000, // suggested: slightly shorter than your scale-to-zero time
  max: 10,
});

// surface errors on idle clients, which include harmless scale-to-zero events, and continue
pool.on('error', (err, _client) => console.warn(`Error emitted by idle Postgres client: ${err.message}`));
*/

import { Kysely, PostgresDialect } from 'kysely';

const kysely = new Kysely({ dialect: new PostgresDialect({ pool }) });

app.get('/Kysely', async (ctx) => {
  const [{ now }] = await kysely.selectNoFrom(kysely.fn('now').as('now')).execute();
  return ctx.html(page('Kysely', now));
});
