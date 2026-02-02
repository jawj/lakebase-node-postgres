/**
 * Fetch Lakebase Postgres credentials from Lakebase token endpoint.
 * @param {string} apiUrl Lakebase Postgres token endpoint URL
 * @param {string | (() => string | Promise<string>)} apiToken OAuth access token
 * @param {string} endpoint Lakebase endpoint identifier: `projects/${projectId}/branches/${branchId}/endpoints/${endpointId}`
 * @returns {Promise<{ token: string, expires: Date }>} Lakebase Postgres credentials
 */
export async function fetchPgCredentials(apiUrl, apiToken, endpoint) {
  console.info('Fetching Lakebase Postgres auth token ...');

  if (typeof apiToken === 'function') apiToken = await apiToken();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  const credentials = await response.json();

  if (!response.ok) {
    const errorMessage = `Couldn't get Lakebase Postgres OAuth token: ${credentials.error_code} ${credentials.message}`;
    throw new Error(`Couldn't get Lakebase Postgres OAuth token: ${errorMessage}`);
  }
  
  const { token } = credentials;
  const expires = new Date(credentials.expire_time); // expire_time is an ISO8601 string
  return { token, expires };
}
