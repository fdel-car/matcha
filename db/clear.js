const db = require('./index');
const fs = require('fs');

(async function main() {
  await db.query('DROP TABLE IF EXISTS interest_list CASCADE');
  await db.query('DROP TABLE IF EXISTS interests CASCADE');
  await db.query('DROP TABLE IF EXISTS images CASCADE');
  await db.query('DROP TABLE IF EXISTS profiles CASCADE');
  await db.query('DROP TABLE IF EXISTS users CASCADE');
  const uploadDir = `${__dirname}/../protected/img/`;
  const files = fs.readdirSync(uploadDir);
  files.forEach(filename => {
    if (fs.statSync(uploadDir + filename).isFile()) {
      fs.unlinkSync(uploadDir + filename);
    }
  });
  await db.close();
})();
