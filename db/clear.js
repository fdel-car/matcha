const db = require('./index');
const fs = require('fs');

(async function main() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM images');
  const uploadDir = `${__dirname}/../protected/img/`;
  const files = fs.readdirSync(uploadDir);
  files.forEach(filename => {
    if (fs.statSync(uploadDir + filename).isFile()) {
      fs.unlinkSync(uploadDir + filename);
    }
  });
  await db.close();
})();
