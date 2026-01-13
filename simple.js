import 'dotenv/config';
import { Pool } from 'pg';

// in this simple version we would fetch a new OAuth token for every new connection

const pool = new Pool({
  // node-postgres reads PGUSER, PGHOST, PGDATABASE and PGSSLMODE from process.env
  password: async () => {
    const { PGUSER, CLIENT_SECRET, TOKEN_URL } = process.env;
    const auth = Buffer.from(`${PGUSER}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials&scope=all-apis', // there's currently no Lakebase scope
    });
    const json = await response.json();
    if (response.ok) return json.access_token;

    const errorMessage = `${response.status} ${response.statusText}: ${json.error_description}`
    throw new Error(`Could not get Databricks OAuth token: ${errorMessage}`);
  }
});

process.stdout.write('The time is: ');
const { rows: [{ now }] } = await pool.query('SELECT now()');
process.stdout.write(`${now.toISOString()}\n`);
pool.end();
