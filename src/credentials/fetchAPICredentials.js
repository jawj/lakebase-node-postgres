/**
 * Fetch OAuth API credentials from Databricks OIDC endpoint.
 * @param {string} oidcURL OIDC token endpoint URL
 * @param {string} clientID OAuth client ID
 * @param {string} clientSecret OAuth client secret
 * @returns {Promise<{ access_token: string, expires_in: number }>} OAuth credentials
 */
export async function fetchAPICredentials(oidcURL, clientID, clientSecret) {
  console.info('Fetching API auth token ...');
  
  const auth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
  const response = await fetch(oidcURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=all-apis', // there's currently no Lakebase-specific scope
  });
  const APICredentials = await response.json();
  if (response.ok) return APICredentials;

  // handle API errors
  const errorMessage = `${response.status} ${response.statusText}: ${APICredentials.error_description}`
  throw new Error(`Couldn't get Databricks API OAuth token: ${errorMessage}`);
}
