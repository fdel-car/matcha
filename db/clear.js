const db = require('./index');
const fs = require('fs');

(async function main() {
  await db.query('DROP TABLE interest_list CASCADE');
  await db.query('DROP TABLE interests CASCADE');
  await db.query('DROP TABLE images CASCADE');
  await db.query('DROP TABLE users CASCADE');
  const uploadDir = `${__dirname}/../protected/img/`;
  const files = fs.readdirSync(uploadDir);
  files.forEach(filename => {
    if (fs.statSync(uploadDir + filename).isFile()) {
      fs.unlinkSync(uploadDir + filename);
    }
  });
  await db.close();
})();
