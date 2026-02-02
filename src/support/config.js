import 'dotenv/config'; // loads .env file into process.env

/** @param {string} varName Missing environment variable name */
const makeErrMsg = varName =>
  `Missing process.env.${varName} (check .env.example for required environment variables).`;

const { env } = process;

if (!env.OIDC_URL) throw new Error(makeErrMsg('OIDC_URL'));
export const { OIDC_URL: oidcUrl } = env;

if (!env.PG_TOKEN_URL) throw new Error(makeErrMsg('PG_TOKEN_URL'));
export const { PG_TOKEN_URL: pgTokenUrl } = env;

if (!env.CLIENT_ID) throw new Error(makeErrMsg('CLIENT_ID'));
export const { CLIENT_ID: clientId } = env;

if (!env.CLIENT_SECRET) throw new Error(makeErrMsg('CLIENT_SECRET'));
export const { CLIENT_SECRET: clientSecret } = env;

if (!env.PG_PROJECT) throw new Error(makeErrMsg('PG_PROJECT'));
export const { PG_PROJECT: project } = env;

if (!env.PG_BRANCH) throw new Error(makeErrMsg('PG_BRANCH'));
export const { PG_BRANCH: branch } = env;

if (!env.PG_ENDPOINT) throw new Error(makeErrMsg('PG_ENDPOINT'));
export const { PG_ENDPOINT: endpoint } = env;

if (!env.PGHOST) throw new Error(makeErrMsg('PGHOST'));
export const { PGHOST: pgHost } = env;

if (!env.PGDATABASE) throw new Error(makeErrMsg('PGDATABASE'));
export const { PGDATABASE: pgDb } = env;
