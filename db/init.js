const db = require('./index');
const { exec } = require('child_process');

(function main() {
  exec('createdb matcha-db', async function(err, stdout, stderr) {
    await db.query(
      'CREATE TABLE IF NOT EXISTS users (\
id serial UNIQUE,\
username varchar(32) UNIQUE,\
first_name varchar(32),\
last_name varchar(32),\
email varchar(64) UNIQUE,\
password varchar,\
verified boolean DEFAULT FALSE,\
verify_token varchar)'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS pictures (\
id serial UNIQUE,\
user_id integer NOT NULL,\
filename varchar,\
position smallint)'
    );
    await db.close();
  }); // Create db if it does not exist yet, otherwise silently fail
})();
