const db = require('./index');

(async function main() {
  await db.query('CREATE SCHEMA IF NOT EXISTS schema');
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema.users (id serial UNIQUE, username varchar(32) UNIQUE, first_name varchar(32), last_name varchar(32), email varchar(64) UNIQUE, password varchar)'
  );
  await db.close();
})();
