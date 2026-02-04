/**
 * This basic script shows how to use Lakebase Postgres with postgres.js
 * (`import 'postgres'`). For examples with other drivers, see 
 * backgroundTask.js and webApp.js.
 * 
 * For a short, one-shot script of this sort, which makes only one database
 * connection, the onDemandConfig and uncachedConfig are both suitable. But in
 * case future changes cause additional connections to be made, using the
 * caching option is probably better.
 * 
 * The timedRefreshConfig is less well suited to this case: because it uses a
 * setTimeout to refresh credentials, it prevents the script from exiting.
 */

import postgres from 'postgres';
import { onDemandConfig, uncachedConfig } from './lakebase/pgConfig.js';

const sql = postgres(onDemandConfig());  // or: postgres(uncachedConfig());
const [{ now }] = await sql`SELECT now()`;
console.log(`postgres.js: ${now.toISOString()}`);
await sql.end();
