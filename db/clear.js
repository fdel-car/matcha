const db = require('./index');

(async function main() {
  await db.query('DROP TABLE IF EXISTS users CASCADE');
  await db.close();
})();
