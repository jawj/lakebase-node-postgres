/**
 * Fetch OAuth API credentials from Databricks OIDC endpoint.
 * @param {string} oidcUrl OIDC token endpoint URL
 * @param {string} clientId OAuth client ID
 * @param {string} clientSecret OAuth client secret
 * @returns {Promise<{ token: string, expires: Date }>} OAuth credentials
 */
export async function fetchApiCredentials(oidcUrl, clientId, clientSecret) {
  console.info(`${new Date().toISOString()} Fetching API auth token ...`);
  
  const t0 = Date.now();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(oidcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=all-apis', // there's currently no Lakebase-specific scope
  });
  const credentials = await response.json();

  if (!response.ok) {
    const errorMessage = `${response.status} ${response.statusText}: ${credentials.error_description}`;
    throw new Error(`Couldn't get Databricks API OAuth token: ${errorMessage}`);
  }

  const token = credentials.access_token;
  const expires = new Date(t0 + 1000 * credentials.expires_in); // expires_in is in seconds
  
  console.info(`${new Date().toISOString()} Lakebase API auth token fetched, expires around ${expires.toISOString()}`);
  return { token, expires };
}
