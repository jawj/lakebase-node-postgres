import { Client } from 'pg';
import postgres from 'postgres';
import * as Bun from 'bun';

/**
 * Create and connect a client, issue a simple query, and disconnect
 * -- for the three main JS drivers 
 * @param {() => Promise<string>} password
 */
export async function queryAll(password) {
  // node-postgres
  const client = new Client({ password });
  await client.connect();
  const { rows: [{ now: t1 }] } = await client.query('SELECT now()');
  await client.end();
  console.log(`OK: node-postgres. The time is: ${t1.toISOString()}.`);

  // postgres.js
  const sql = postgres({ password, ssl: { rejectUnauthorized: true } });
  const [{ now: t2 }] = await sql`SELECT now()`;
  await sql.end();
  console.log(`OK: postgres.js. The time is: ${t2.toISOString()}.`);

  // Bun.sql
  const bunSql = new Bun.SQL({ 
    password,
    max: 1, // avoid connecting 10 parallel clients
    tls: {
      serverName: process.env.PGHOST, // https://github.com/oven-sh/bun/issues/26369
      rejectUnauthorized: true,
    }
  });
  const [{ now: t3 }] = await bunSql`SELECT now()`;
  console.log(`OK: Bun.SQL. The time is: ${t3.toISOString()}.`);
  await bunSql.close();
};
