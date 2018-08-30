const db = require('./index');
const { exec } = require('child_process');

(function main() {
  exec('createdb matcha-db', async function(err, stdout, stderr) {
    await db.query(
      'CREATE TABLE IF NOT EXISTS users (\
id serial PRIMARY KEY,\
username varchar(32) UNIQUE,\
first_name varchar(32),\
last_name varchar(32),\
email varchar(64) UNIQUE,\
password varchar,\
verified boolean DEFAULT FALSE,\
verify_token uuid DEFAULT NULL)'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS images (\
id serial PRIMARY KEY,\
user_id integer NOT NULL references users(id),\
filename varchar,\
position smallint)'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS interests (\
id serial PRIMARY KEY,\
label varchar UNIQUE NOT NULL)'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS interest_list (\
id serial PRIMARY KEY,\
user_id integer NOT NULL references users(id),\
tag_id integer NOT NULL references interests(id))'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS profiles (\
id serial PRIMARY KEY,\
user_id integer NOT NULL references users(id),\
bio varchar(512) NOT NULL,\
gender smallint NOT NULL,\
sexuality smallint DEFAULT 3,\
country char(2))'
    );
    await db.close();
  }); // Create db if it does not exist yet, otherwise silently fail
})();
