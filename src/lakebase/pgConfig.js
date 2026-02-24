import { apiCredentials } from './auth/apiCredentials.js';
import { pgCredentials } from './auth/pgCredentials.js';
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
  ssl: { rejectUnauthorized: true }, // check against public CAs, same as sslmode=verify-full
};

const apiCredentialsFn = () => apiCredentials(oidcUrl, clientId, clientSecret);

/**
 * Postgres configuration parameters including as async password function that
 * fetches, caches, and refreshes an auth token lazily, only on demand. Use
 * this for non-time-sensitive applications, such as daemons processing queues
 * or background jobs.
 * @param {{ claims?: any[]; expire_time?: string; group_name?: string; ttl?: string; }} params
 * Lakebase Postgres authentication parameters: see documentation
 * @returns Postgres configuration parameters
 */
export function onDemandConfig(params = {}) {
  const onDemandApiTokenFn = cachedWithOnDemandRefresh(withRetries(apiCredentialsFn));
  const onDemandPgCredentialsFn = () => pgCredentials(pgTokenUrl, onDemandApiTokenFn, projectBranchEndpoint, params);
  const onDemandPostgresTokenFn = cachedWithOnDemandRefresh(withRetries(onDemandPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: onDemandPostgresTokenFn,
  }
};

/**
 * Postgres configuration parameters including an async password function that
 * has already fetched and cached an auth token and will refresh it eagerly,
 * before it expires (regardless of whether it is used). Use this for
 * time-sensitive applications, such as user-facing websites and APIs.
 * @param {{ claims?: any[]; expire_time?: string; group_name?: string; ttl?: string; }} params
 * Lakebase Postgres authentication parameters: see documentation
 * @returns Postgres configuration parameters
 */
export async function timedRefreshConfig(params = {}) {
  const timedRefreshApiTokenFn = await cachedWithTimedRefresh(withRetries(apiCredentialsFn));
  const timedRefreshPgCredentialsFn = () => pgCredentials(pgTokenUrl, timedRefreshApiTokenFn, projectBranchEndpoint, params);
  const timedRefreshPostgresTokenFn = await cachedWithTimedRefresh(withRetries(timedRefreshPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: timedRefreshPostgresTokenFn,
  };
}

/**
 * Postgres configuration parameters including as async password function that
 * fetches and caches an auth token every time, without caching. Suited only to
 * brief, one-shot usage, and has no real advantages over the options above.
 * @param {{ claims?: any[]; expire_time?: string; group_name?: string; ttl?: string; }} params
 * Lakebase Postgres authentication parameters: see documentation
 * @returns Postgres configuration parameters
 */
export function uncachedConfig(params = {}) {
  const uncachedApiTokenFn = uncached(withRetries(apiCredentialsFn));
  const uncachedPgCredentialsFn = () => pgCredentials(pgTokenUrl, uncachedApiTokenFn, projectBranchEndpoint, params);
  const uncachedPostgresTokenFn = uncached(withRetries(uncachedPgCredentialsFn));
  return {
    ...commonPgConfig,
    password: uncachedPostgresTokenFn,
  };
}
