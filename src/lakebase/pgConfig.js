import { fetchApiCredentials } from './credentials/fetchApiCredentials.js';
import { fetchPgCredentials } from './credentials/fetchPgCredentials.js';
import { cachedWithOnDemandRefresh } from './caching/onDemandRefresh.js';
import { withRetries } from './asyncRetry.js';

import {
  oidcUrl,
  pgTokenUrl,
  clientId,
  clientSecret,
  projectBranchEndpoint,
  pgHost,
  pgDb,
} from './envConfig.js';
import { cachedWithTimedRefresh } from './caching/timedRefresh.js';

const commonPgConfig = {
  user: clientId,
  host: pgHost,
  database: pgDb,
};

const apiCredentialsFn = () => fetchApiCredentials(oidcUrl, clientId, clientSecret);

export function onDemandPgConfig() {
  const onDemandApiToken = cachedWithOnDemandRefresh(withRetries(apiCredentialsFn));
  const onDemandPgCredentialsFn = () => fetchPgCredentials(pgTokenUrl, onDemandApiToken, projectBranchEndpoint);
  const onDemandPostgresToken = cachedWithOnDemandRefresh(withRetries(onDemandPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: onDemandPostgresToken,
  }
};

export async function timedRefreshPgConfig() {
  const timedRefreshApiToken = await cachedWithTimedRefresh(withRetries(apiCredentialsFn));
  const timedRefreshPgCredentialsFn = () => fetchPgCredentials(pgTokenUrl, timedRefreshApiToken, projectBranchEndpoint);
  const timedRefreshPostgresToken = await cachedWithTimedRefresh(withRetries(timedRefreshPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: timedRefreshPostgresToken,
  };
}
