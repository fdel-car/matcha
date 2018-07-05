const db = require('./index');

(async function main() {
  await db.query('DROP SCHEMA IF EXISTS schema CASCADE');
  await db.close();
})();
