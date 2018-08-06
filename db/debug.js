const db = require('./index');

(async function main() {
  const users = await db.query('SELECT * FROM schema.users');
  console.log(users.rows);
  await db.close();
})();
