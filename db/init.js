const db = require('./index');
const { exec } = require('child_process');
const hobbies = require('./hobbies');

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
online boolean DEFAULT FALSE,\
last_online_at timestamptz DEFAULT now(),\
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
label varchar(128) UNIQUE NOT NULL)'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS interest_list (\
id serial PRIMARY KEY,\
user_id integer NOT NULL references users(id),\
interest_id integer NOT NULL references interests(id))'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS profiles (\
id serial PRIMARY KEY,\
user_id integer NOT NULL references users(id),\
bio varchar(512) NOT NULL,\
gender smallint NOT NULL,\
sexuality smallint DEFAULT 3,\
birthday date NOT NULL,\
lat float8 DEFAULT NULL,\
long float8 DEFAULT NULL,\
country char(2))'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS likes (\
id serial PRIMARY KEY,\
src_uid integer NOT NULL references users(id),\
dest_uid integer NOT NULL references users(id),\
liked_at timestamptz DEFAULT now())'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS visits (\
id serial PRIMARY KEY,\
src_uid integer NOT NULL references users(id),\
dest_uid integer NOT NULL references users(id),\
visited_at timestamptz DEFAULT now())'
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS blockages (\
id serial PRIMARY KEY,\
src_uid integer NOT NULL references users(id),\
dest_uid integer NOT NULL references users(id),\
blocked_at timestamptz DEFAULT now())'
    );
    const promises = hobbies.map(hobby => {
      hobby = hobby.toLowerCase().replace(/^[0-9]*\w/, c => c.toUpperCase());
      return db
        .query(
          'INSERT INTO interests (id, label) VALUES (DEFAULT, $1)',
          [hobby],
          false,
          false
        )
        .catch(err => {
          // Silently fail, it's useless to call init multiple times
        });
    });
    await Promise.all(promises);
    await db.close();
  }); // Create db if it does not exist yet, otherwise silently fail
})();
