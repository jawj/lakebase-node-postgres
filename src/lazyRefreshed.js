import 'dotenv/config'; // load .env file into process.env

import { fetchAPICredentials } from './credentials/fetchAPICredentials.js';
import { lazyRefreshedCredentials } from './caching/lazyRefreshedCredentials.js';
import { withRetries } from './util/withRetries.js';
import { queryAll } from './queryAll.js';

await queryAll(withRetries(lazyRefreshedCredentials(fetchAPICredentials)));
