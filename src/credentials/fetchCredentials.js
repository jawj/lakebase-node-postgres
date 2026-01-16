
export async function fetchCredentials() {
  // note: PGUSER, PGHOST, PGDATABASE and PGSSLMODE will be read direcly by node-postgres, if set
  const { PGUSER, CLIENT_SECRET, TOKEN_URL } = process.env;
  if (!TOKEN_URL || !PGUSER || !CLIENT_SECRET) throw new Error('Required in .env: TOKEN_URL, PGUSER, CLIENT_SECRET');

  // fetch OAuth token from API endpoint
  const auth = Buffer.from(`${PGUSER}:${CLIENT_SECRET}`).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=all-apis', // there's currently no Lakebase-specific scope
  });
  const token = await response.json();
  if (response.ok) return token;

  // handle API errors
  const errorMessage = `${response.status} ${response.statusText}: ${token.error_description}`
  throw new Error(`Couldn't get Databricks OAuth token: ${errorMessage}`);
}
