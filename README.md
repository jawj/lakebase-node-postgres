# Lakebase Postgres from JavaScript/TypeScript

These examples show how to authenticate with and query Lakebase Postgres from JavaScript. JSDoc type annotations are included.

You can:

* Drop the code in the `lakebase` folder into your own project
* Set appropriate environment variables by following the template in `.env.example`
* Call one of the functions in `pgConfig.js` for a configuration you can pass to a driver


# Three examples

Three examples are given:

* A basic web app, using Hono (`webApp.js`).
* A long-running task that queries Postgres at irregular intervals  (`backgroundTask.js`).
* A simple one-shot script that makes a single Postgres connection, processes the result, and exits (`oneShotScript.js`).


# Three approaches to refreshing credentials

Databricks OAuth and Lakebase API credentials both expire after a maximum of one hour. To support these examples, three alternative approaches to caching and refreshing credentials are provided:

* Caching with eager/interval-based refresh: an auth token is obtained at startup and refreshed a few minutes ahead of expiry. This approach is demonstrated in `webApp.js`, as it minimises latency. 
* Caching with lazy/on-demand refresh: an auth token is obtained on first access and refreshed on access if expired (or nearly so). This approach is demonstrated in `backgroundTask.js`, as it minimises back-end load.
* No caching: new credentials are obtained for every Postgres connection. This approach could have been used in `oneShotScript.js`, but it has no advantage over lazy/on-demand refresh, which is used instead.


# Three JavaScript Postgres drivers

The web app and background tasks provide examples of connecting to Postgres using all three major JavaScript Postgres drivers:

* node-postgres (`npm install pg`)
* postgres.js (`npm install postgres`)
* Bun.SQL

We use the capability of all three drivers to accept an async function (signature: `() => Promise<string>`) as the Postgres password.
