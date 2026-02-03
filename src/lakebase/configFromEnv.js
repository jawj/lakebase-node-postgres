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

if (!env.LAKEBASE_PROJECT) throw new Error(makeErrMsg('LAKEBASE_PROJECT'));
const { LAKEBASE_PROJECT: project } = env;

if (!env.LAKEBASE_BRANCH) throw new Error(makeErrMsg('LAKEBASE_BRANCH'));
const { LAKEBASE_BRANCH: branch } = env;

if (!env.LAKEBASE_ENDPOINT) throw new Error(makeErrMsg('LAKEBASE_ENDPOINT'));
const { LAKEBASE_ENDPOINT: endpoint } = env;

export const projectBranchEndpoint = `projects/${project}/branches/${branch}/endpoints/${endpoint}`;

if (!env.PG_HOST) throw new Error(makeErrMsg('PG_HOST'));
export const { PG_HOST: pgHost } = env;

if (!env.PG_DATABASE) throw new Error(makeErrMsg('PG_DATABASE'));
export const { PG_DATABASE: pgDb } = env;
