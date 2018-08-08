const db = require('./index');
const { exec } = require('child_process');

(function main() {
  exec('createdb db', async function(err, stdout, stderr) {
    await db.query('CREATE SCHEMA IF NOT EXISTS schema');
    await db.query(
      'CREATE TABLE IF NOT EXISTS schema.users (\
id serial UNIQUE,\
username varchar(32) UNIQUE,\
first_name varchar(32),\
last_name varchar(32),\
email varchar(64) UNIQUE,\
password varchar,\
verified boolean DEFAULT FALSE,\
verifyToken varchar)'
    );
    await db.close();
  }); // Create db if it does not exist yet, otherwise silently fail
})();
