const db = require('./index');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const colors = require('colors');
const sjcl = require('../sjcl');
const hobbies = require('./hobbies');
const bios = require('./bios');
const fs = require('fs');

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

const date = new Date();
const currentYear = date.getFullYear();
const currentMonth = date.getMonth();
const currentDay = date.getDate();
const startDate = new Date(currentYear - 40, currentMonth, currentDay);
const endDate = new Date(currentYear - 18, currentMonth, currentDay);

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getSexuality() {
  const int = getRandomInt(100);
  if (int < 80) return 1;
  if (int < 90) return 2;
  return 3;
}

String.prototype.toProperCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

(async function main() {
  let n = Number(process.argv[2]) || 10;
  const usersInDB = await db.query('SELECT id FROM users');
  const uploadDir = `${__dirname}/../protected/img/`;
  const files = fs.readdirSync(uploadDir);
  let fake = { male: 0, female: 0 };
  files.forEach(file => {
    if (/^male\-.*\.jpg$/.test(file)) fake.male++;
    if (/^female\-.*\.jpg$/.test(file)) fake.female++;
  });
  const res = await fetch(
    `https://randomuser.me/api?exc=picture,registered,phone,cell,id,dob&noinfo&results=${n}&password=upper,lower,number,8-24`
  );
  const users = await res.json();
  const promises = users.results.map(user => {
    const bitArray = sjcl.hash.sha256.hash(user.login.password);
    return db
      .query(
        'INSERT INTO users (first_name, last_name, username, email, password, verified) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
        [
          user.name.first.toProperCase(),
          user.name.last.toProperCase(),
          user.login.username,
          user.email,
          bcrypt.hashSync(sjcl.codec.hex.fromBits(bitArray), 8)
        ],
        false,
        false
      )
      .then(async res => {
        console.log(
          `User ${user.login.username.green.bold} created! ${
            user.login.password.red.bold
          } is the password for this account.`
        );
        try {
          await db.query(
            'INSERT INTO profiles (user_id, bio, gender, sexuality, birthday, lat, long, country) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
            [
              res.rows[0].id,
              bios[getRandomInt(bios.length)],
              user.gender === 'male' ? 1 : 2,
              getSexuality(),
              randomDate(startDate, endDate),
              user.location.coordinates.latitude,
              user.location.coordinates.longitude,
              user.nat
            ],
            false,
            false
          );
          await db.query(
            'INSERT INTO images (user_id, filename, position) VALUES ($1, $2, 1)',
            [
              res.rows[0].id,
              `${user.gender}-${getRandomInt(fake[user.gender]) + 1}.jpg`
            ],
            false,
            false
          );
          let nbr = getRandomInt(3);
          let ids = [];
          for (let i = 0; i <= nbr; i++) {
            let interest = hobbies[getRandomInt(hobbies.length)];
            interest = interest
              .toLowerCase()
              .replace(/^[0-9]*\w/, c => c.toUpperCase());
            const inDB = await db.query(
              'SELECT * FROM interests WHERE label = ($1)',
              [interest],
              false,
              false
            );
            if (!ids.includes(inDB.rows[0].id)) {
              await db.query(
                'INSERT INTO interest_list (user_id, interest_id) VALUES($1, $2)',
                [res.rows[0].id, inDB.rows[0].id],
                false,
                false
              );
              ids.push(inDB.rows[0].id);
            }
          }
          nbr = getRandomInt(5);
          ids = [res.rows[0].id];
          for (let i = 0; i <= nbr; i++) {
            const id = getRandomInt(usersInDB.rowCount + n) + 1;
            if (!ids.includes(id)) {
              db.query(
                'INSERT INTO visits (src_uid, dest_uid, visited_at) VALUES($1, $2, now())',
                [res.rows[0].id, id],
                false,
                false
              );
              db.query(
                'INSERT INTO notifications (src_uid, dest_uid, description) VALUES ($1, $2, $3)',
                [
                  res.rows[0].id,
                  id,
                  `This user, ${
                    user.login.username
                  }, visited you for the first time!`
                ],
                false,
                false
              );
              ids.push(id);
            }
          }
          nbr = getRandomInt(3);
          ids = [res.rows[0].id];
          for (let i = 0; i <= nbr; i++) {
            const id = getRandomInt(usersInDB.rowCount + n) + 1;
            if (!ids.includes(id)) {
              db.query(
                'INSERT INTO likes (src_uid, dest_uid, liked_at) VALUES($1, $2, now())',
                [res.rows[0].id, id],
                false,
                false
              );
              ids.push(id);
            }
          }
          return 'Success';
        } catch (err) {
          console.log(
            `Error: ${err.message}, extended profile creation for ${
              user.login.username.green.bold
            } encountered an issue.`
          );
          return 'Failure';
        }
      })
      .catch(err => {
        if (err.code == 23505) {
          const fieldName = (err.detail.match(/Key \(([a-z,_]*?)\)=/) || [])[1];
          console.log(
            `This ${fieldName.red.bold} is already taken, ${
              user.login.username.red.bold
            } account was not created.`
          );
        }
        return 'Failure';
      });
  });
  const results = await Promise.all(promises);
  results.forEach(result => (result === 'Failure' ? n-- : null));
  console.log(`${String(n).yellow.bold} users were successfully created.`);
  await db.close();
})();
