const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const { databaseUrl } = require('./security');

const pool = new Pool({
  connectionString: databaseUrl(),
});

pool.on('error', (err) => {
  // Log but do NOT exit: an idle-client error (e.g. Postgres restart, or the
  // seed script dropping tables while the server is up) is recoverable — the
  // pool discards the broken connection and opens a fresh one on next query.
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
