/**
 * Fetch Lakebase Postgres credentials from Lakebase token endpoint.
 * Expects PG_TOKEN_URL, PGUSER, CLIENT_SECRET in process.env
 * @param {string} APIURL Lakebase Postgres token endpoint URL
 * @param {string} APIToken OAuth access token
 * @param {string} lakebaseEndpoint Lakebase endpoint identifier: `projects/${project_ID}/branches/${branch_ID}/endpoints/${endpoint_ID}`
 * @returns {Promise<{ token: string, expire_time: string }>} Lakebase Postgres credentials
 */
export async function fetchPostgresCredentials(APIURL, APIToken, lakebaseEndpoint) {
  console.info('Fetching Lakebase Postgres auth token ...');
  
  const response = await fetch(APIURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APIToken}`,
    },
    body: JSON.stringify({ endpoint: lakebaseEndpoint }),
  });
  const postgresCredentials = await response.json();
  if (response.ok) return postgresCredentials;

  // throw API errors
  throw new Error(`Couldn't get Lakebase Postgres OAuth token: ${postgresCredentials.error_code} ${postgresCredentials.message}`);
}
