import { fetchApiCredentials } from './credentials/fetchApiCredentials.js';
import { fetchPgCredentials } from './credentials/fetchPgCredentials.js';
import { cachedWithOnDemandRefresh } from './caching/onDemandRefresh.js';
import { cachedWithTimedRefresh } from './caching/timedRefresh.js';
import { uncached } from './caching/uncached.js';
import { withRetries } from './asyncRetry.js';

import {
  oidcUrl,
  pgTokenUrl,
  clientId,
  clientSecret,
  projectBranchEndpoint,
  pgHost,
  pgDb,
} from './configFromEnv.js';

const commonPgConfig = {
  user: clientId,
  host: pgHost,
  database: pgDb,
  ssl: { rejectUnauthorized: false },
};

const apiCredentialsFn = () => fetchApiCredentials(oidcUrl, clientId, clientSecret);

/**
 * Postgres configuration parameters including as async password function that
 * fetches, caches, and refreshes an auth token lazily, only on demand. Use
 * this for non-time-sensitive applications, such as daemons processing queues
 * or background jobs.
 * @returns Postgres configuration parameters
 */
export function onDemandConfig() {
  const onDemandApiToken = cachedWithOnDemandRefresh(withRetries(apiCredentialsFn));
  const onDemandPgCredentialsFn = () => fetchPgCredentials(pgTokenUrl, onDemandApiToken, projectBranchEndpoint);
  const onDemandPostgresToken = cachedWithOnDemandRefresh(withRetries(onDemandPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: onDemandPostgresToken,
  }
};

/**
 * Postgres configuration parameters including as async password function that
 * fetches and caches an auth token immediately, and refreshes it eagerly, 
 * before it expires (regardless of whether it is needed). Use this for
 * time-sensitive applications, such as user-facing websites and APIs.
 * @returns Postgres configuration parameters
 */
export async function timedRefreshConfig() {
  const timedRefreshApiToken = await cachedWithTimedRefresh(withRetries(apiCredentialsFn));
  const timedRefreshPgCredentialsFn = () => fetchPgCredentials(pgTokenUrl, timedRefreshApiToken, projectBranchEndpoint);
  const timedRefreshPostgresToken = await cachedWithTimedRefresh(withRetries(timedRefreshPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: timedRefreshPostgresToken,
  };
}

/**
 * Postgres configuration parameters including as async password function that
 * fetches and caches an auth token every time, without caching. Use only for
 * brief, one-shot applications such as shell scripts.
 * @returns Postgres configuration parameters
 */
export function uncachedConfig() {
  return {
    ...commonPgConfig,
    password: uncached(withRetries(apiCredentialsFn)),
  };
}
