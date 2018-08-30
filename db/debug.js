const db = require('./index');

(async function main() {
  const users = await db.query('SELECT * FROM users');
  console.log(users.rows);
  const profiles = await db.query('SELECT * FROM profiles');
  console.log(profiles.rows);
  await db.close();
})();
