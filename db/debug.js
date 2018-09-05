const db = require('./index');

(async function main() {
  const users = await db.query('SELECT * FROM users');
  console.log(users.rows);
  const profiles = await db.query('SELECT * FROM profiles');
  console.log(profiles.rows);
  const images = await db.query('SELECT * FROM images');
  console.log(images.rows);
  const interests = await db.query('SELECT * FROM interests');
  console.log(interests.rows);
  const interest_list = await db.query('SELECT * FROM interest_list');
  console.log(interest_list.rows);
  await db.close();
})();
