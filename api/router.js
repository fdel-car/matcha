const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const validateInput = require('./validate_input');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const formidable = require('formidable');
const fs = require('fs');

const uploadDir = `${__dirname}/../protected/img/`;
const imgExtension = ['gif', 'png', 'jpg', 'jpeg', 'ico'];

const getTargetedGenders = (gender, sexuality) => {
  if (!gender || !sexuality) return [1, 2];
  if (sexuality == 1) {
    return gender == 1 ? [2] : [1];
  } else if (sexuality == 2) {
    if (!parseInt(gender)) return [1, 2];
    return [gender];
  } else return [1, 2];
};

const generateJWT = (uid, xsrfToken) =>
  jwt.sign({ uid, xsrfToken }, process.env.SECRET);
function generateToken() {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    sendmail: true
  });
  const token = uuidv4();
  return { transporter, token };
}
function sendMail(transporter, req, email, token) {
  transporter.sendMail(
    {
      from: 'Matcha@love.com',
      to: email,
      subject: 'Verify your account, your love is awaiting 🍑',
      html: `Click <a href="${req.protocol}://${req.get(
        'Host'
      )}/verify?email=${encodeURI(
        email
      )}&token=${token}">here</a> to verify your account.`
    },
    (err, info) => {
      if (err) console.error(err.message);
      console.log(info.envelope);
      transporter.close();
    }
  );
}

router.post('/login', async (req, res, next) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ error: 'No body passed to make the call.' });
    const { username, password } = req.body;
    const errors = validateInput({ username, password });
    if (errors.length > 0)
      return res.status(400).json({ error: errors.join(' ') });
    const user = await db.query(
      'SELECT password, id, email FROM users WHERE username = ($1)',
      [username]
    );
    if (!user.rows[0])
      return res.status(400).json({ error: 'This username does not exist.' });
    const hash = user.rows[0].password;
    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      const xsrfToken = uuidv4();
      res.cookie('jwt', generateJWT(user.rows[0].id, xsrfToken), {
        httpOnly: true
        // maxAge: 3600000
      });
      res.status(200).json({ xsrfToken });
    } else {
      return res.status(401).json({ error: 'Invalid password provided.' });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ error: 'No body passed to make the call.' });
    const { email, token } = req.body;
    const errors = validateInput({ email });
    if (errors.length > 0)
      return res.status(400).json({ error: errors.join(' ') });
    const user = await db.query(
      'SELECT verify_token, verified FROM users WHERE email = ($1)',
      [email]
    );
    if (!user.rows[0])
      return res
        .status(400)
        .json({ error: 'No user associated with this email.' });
    const { verify_token, verified } = user.rows[0];
    if (verified)
      return res
        .status(403)
        .json({ error: 'This email address has already been verified.' });
    if (token === verify_token) {
      await db.query(
        'UPDATE users SET verified = TRUE, verify_token = NULL WHERE email = ($1)',
        [email]
      );
      return res.sendStatus(204);
    }
    return res
      .status(403)
      .json({ error: 'This token is outdated and / or invalid.' });
  } catch (err) {
    next(err);
  }
});

router.post('/verify/resend_email', async (req, res, next) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json({ error: 'No body passed to make the call.' });
    const { email } = req.body;
    const errors = validateInput({ email });
    if (errors.length > 0)
      return res.status(400).json({ error: errors.join(' ') });
    const user = await db.query(
      'SELECT verified FROM users WHERE email = ($1)',
      [email]
    );
    if (!user.rows[0])
      return res
        .status(400)
        .json({ error: 'No user associated with this email.' });
    const verified = user.rows[0].verified;
    if (verified)
      return res.status(403).json({
        error: 'The user associated with this email is already verified.'
      });
    const { transporter, token } = generateToken();
    await db.query('UPDATE users SET verify_token = ($2) WHERE email = ($1)', [
      email,
      token
    ]);
    sendMail(transporter, req, email, token);
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.post('/user', (req, res, next) => {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  const { username, first_name, last_name, email, password } = req.body;
  const errors = validateInput({
    username,
    first_name,
    last_name,
    email,
    password
  });
  if (errors.length > 0)
    return res.status(400).json({ error: errors.join(' ') });
  bcrypt.hash(password, 12, async function(err, hash) {
    if (err) return next(err);
    try {
      const { transporter, token } = generateToken();
      await db.query(
        'INSERT INTO users (id, username, first_name, last_name, email, password, verify_token) VALUES (DEFAULT, trim($1), trim($2), trim($3), trim($4), $5, $6)',
        [username, first_name, last_name, email, hash, token]
      );
      sendMail(transporter, req, email, token);
      res
        .status(200)
        .send(
          `Hi ${username} 👋, you're successfully registered! A confirmation email has been sent to ${email}.`
        );
    } catch (err) {
      // For now it only get the first error, I want them all
      if (err.code == 23505) {
        const fieldName = (err.detail.match(/Key \(([a-z,_]*?)\)=/) || [])[1];
        error = `This ${fieldName} is already taken.`;
        return res.status(400).json({ error, fieldName });
      }
      next(err);
    }
  });
});

router.use(function(req, res, next) {
  const JWToken = req.cookies.jwt;
  if (!JWToken) return res.sendStatus(401);
  const xsrfToken = req.headers['x-xsrf-token'];
  if (req.method !== 'GET' && !xsrfToken) return res.sendStatus(401);
  jwt.verify(JWToken, process.env.SECRET, async function(err, decoded) {
    if (err) return res.sendStatus(401);
    try {
      if (req.method !== 'GET' && decoded.xsrfToken !== xsrfToken)
        return res.sendStatus(401); // CSRF attack!
      const user = await db.query(
        'SELECT id, username, first_name, last_name, email, verified FROM users WHERE id = ($1)',
        [decoded.uid],
        false,
        false
      );
      if (!user.rows[0]) return res.sendStatus(400); // Very unlikely
      req.user = user.rows[0];
      next();
    } catch (err) {
      next(err);
    }
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwt', { path: '/', httpOnly: true });
  res.sendStatus(200);
});

router.get('/user', function(req, res, next) {
  res.status(200).json(req.user);
});

router.get('/user/:id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.id)) res.sendStatus(400);
    const user = await db.query(
      'SELECT id, username, first_name, last_name, online, last_online_at FROM users WHERE id = ($1)',
      [req.params.id]
    );
    if (req.user.id != req.params.id)
      db.query(
        'SELECT id FROM visits WHERE src_uid = ($1) AND dest_uid = ($2)',
        [req.user.id, req.params.id]
      )
        .then(async result => {
          if (result.rows[0])
            await db.query(
              'UPDATE visits SET visited_at = now() WHERE id = ($1)',
              [result.rows[0].id]
            );
          else {
            await db.query(
              'INSERT INTO visits (src_uid, dest_uid, visited_at) VALUES($1, $2, now())',
              [req.user.id, req.params.id]
            );
            db.query(
              'SELECT id FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
              [req.params.user_id, req.user.id]
            ).then(inDB => {
              if (!inDB.rows[0])
                db.query(
                  "INSERT INTO notifications (src_uid, dest_uid, type) VALUES ($1, $2, 'visit')",
                  [req.user.id, req.params.id]
                ).then(() => {
                  if (req.io_users[req.params.id])
                    req.io_users[req.params.id].forEach(socketId =>
                      req.io.to(socketId).emit('new-notification')
                    );
                });
            });
          }
        })
        .catch(err => next(err));
    res.status(200).json(user.rows[0] || {});
  } catch (err) {
    next(err);
  }
});

router.get('/file/protected/:name', function(req, res, next) {
  const fileName = req.params.name;
  let fileType = fileName.split('.');
  fileType = fileType[fileType.length - 1];
  const options = {
    root:
      __dirname +
      `/../protected/${
      imgExtension.indexOf(fileType) >= 0 ? 'img/' : 'other/'
      }`,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  res.sendFile(fileName, options, function(err) {
    if (err) {
      next(err);
    }
  });
});

router.get('/images/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    const results = await db.query(
      'SELECT filename FROM images INNER JOIN users ON users.id=images.user_id WHERE images.user_id = ($1) ORDER BY position',
      [req.params.user_id]
    );
    res.status(200).json(results.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/images', async function(req, res, next) {
  const form = new formidable.IncomingForm();
  form.maxFileSize = 10 * 1024 * 1024;
  form.parse(req, function(err, fields, files) {
    if (err) {
      if (err.message.includes('maxFileSize exceeded'))
        return res
          .status(400)
          .send('The file received is too large, the maximum size is 10MB.');
      return next(err);
    }
    if (fields.position < 1 || fields.position > 4) return res.sendStatus(400);
    const file = files.image;
    if (!file) return res.status(400).send('No file to upload.');
    let fileType = file.name.split('.');
    fileType = fileType[fileType.length - 1];
    const filename = uuidv4() + '.' + fileType;
    fs.rename(file.path, uploadDir + filename, async function(err) {
      try {
        if (err) {
          fs.copyFileSync(file.path, uploadDir + filename);
          fs.unlink(
            file.path,
            err =>
              err ? console.error(`Error in /tmp file deletion: ${err}`) : null
          );
        }
        const inDB = await db.query(
          'SELECT id, filename FROM images WHERE user_id = ($1) AND position = ($2)',
          [req.user.id, fields.position]
        );
        if (inDB.rows[0]) {
          if (!/^(male|female)\-.*\.jpg$/.test(inDB.rows[0].filename))
            fs.unlink(
              uploadDir + inDB.rows[0].filename,
              err =>
                err
                  ? console.error(`Error in previous file deletion: ${err}`)
                  : null
            );
          await db.query('UPDATE images SET filename = ($1) WHERE id = ($2)', [
            filename,
            inDB.rows[0].id
          ]);
        } else {
          await db.query(
            'INSERT INTO images (id, user_id, filename, position) VALUES(DEFAULT, $1, $2, $3)',
            [req.user.id, filename, fields.position]
          );
        }
      } catch (err) {
        return next(err);
      }
      res.sendStatus(204);
    });
  });
});

router.post('/images/swap', async function(req, res, next) {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  if (
    !req.body.a ||
    !req.body.b ||
    req.body.a === req.body.b ||
    (req.body.a < 1 || req.body.a > 4) ||
    (req.body.b < 1 || req.body.b > 4)
  )
    return res.sendStatus(400);
  try {
    await db.query(
      'UPDATE images SET position = CASE WHEN position = ($1) THEN ($3) ELSE ($1) END WHERE user_id = ($2) AND (position = ($1) OR position = ($3))',
      [req.body.a, req.user.id, req.body.b]
    );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get('/profile/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    const profile = await db.query(
      "SELECT bio, gender, sexuality, to_char(birthday, 'YYYY-MM-DD') as birthday, CAST((CURRENT_DATE - birthday) / 365.242199 as FLOAT) as age, country, lat, long FROM profiles WHERE user_id = ($1)",
      [req.params.user_id]
    );
    res.status(200).send(profile.rows[0] || {});
  } catch (err) {
    next(err);
  }
});

router.post('/profile', async function(req, res, next) {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  const { email, first_name, last_name, birthday, bio } = req.body;
  const errors = validateInput({
    email,
    last_name,
    first_name,
    birthday,
    bio
  });
  if (errors.length > 0)
    return res.status(400).json({ error: errors.join(' ') });
  try {
    const profile = await db.query(
      'SELECT * FROM profiles WHERE user_id = ($1)',
      [req.user.id]
    );
    if (!profile.rows[0]) {
      await db.query(
        'INSERT INTO profiles (id, user_id, bio, gender, sexuality, birthday, country) VALUES (DEFAULT, $1, trim($2), $3, $4, $5, $6)',
        [
          req.user.id,
          bio,
          req.body.gender,
          req.body.sexuality,
          birthday,
          req.body.country || null
        ]
      );
    } else {
      await db.query(
        'UPDATE profiles SET bio = (trim($1)), gender = ($2), sexuality = ($3), birthday = ($4), country = ($5) WHERE id = ($6)',
        [
          bio,
          req.body.gender,
          req.body.sexuality,
          birthday,
          req.body.country || null,
          profile.rows[0].id
        ]
      );
    }
    await db.query(
      'UPDATE users SET first_name = trim($1), last_name = trim($2), email = trim($3) WHERE id = ($4)',
      [first_name, last_name, email, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    if (err.code == 23505) {
      const fieldName = (err.detail.match(/Key \(([a-z,_]*?)\)=/) || [])[1];
      error = `This ${fieldName} is already taken.`;
      return res.status(400).json({ error, fieldName });
    }
    next(err);
  }
});

router.get('/profile/interests/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    const interests = await db.query(
      'SELECT * FROM interests WHERE id IN (SELECT interest_id FROM interest_list WHERE user_id = ($1))',
      [req.params.user_id]
    );
    res.status(200).send(interests.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/profile/notifications', async function(req, res, next) {
  try {
    const notifications = await db.query(
      'SELECT id, src_uid, type, created_at FROM notifications WHERE dest_uid = ($1) ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    db.query('UPDATE notifications SET seen = TRUE WHERE dest_uid = ($1)', [
      req.user.id
    ]).then(() => {
      if (req.io_users[req.user.id])
        req.io_users[req.user.id].forEach(socketId =>
          req.io.to(socketId).emit('reset-notification-count')
        );
    });
    const promises = notifications.rows.map(notification => {
      return db
        .query(
          'SELECT username, filename FROM users\
            LEFT JOIN images ON users.id = images.user_id AND images.position = 1\
          WHERE users.id = ($1)',
          [notification.src_uid],
          false,
          false
        )
        .then(result => {
          notification.src_user = result.rows[0];
        });
    });
    await Promise.all(promises);
    res.status(200).send(notifications.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/profile/interest', async function(req, res, next) {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  let { interest } = req.body;
  const errors = validateInput({ interest });
  if (errors.length > 0)
    return res.status(400).json({ error: errors.join(' ') });
  interest = interest.toLowerCase().replace(/^[0-9]*\w/, c => c.toUpperCase());
  try {
    const inDB = await db.query('SELECT * FROM interests WHERE label = ($1)', [
      interest
    ]);
    const id = !inDB.rows[0]
      ? (await db.query(
        'INSERT INTO interests (id, label) VALUES (DEFAULT, $1) RETURNING id',
        [interest]
      )).rows[0].id
      : inDB.rows[0].id;
    db.query(
      'SELECT * FROM interest_list WHERE user_id = ($1) AND interest_id = ($2)',
      [req.user.id, id]
    )
      .then(async result => {
        if (result.rows[0])
          return res.status(400).json({
            error: 'You already have this interest mentioned in your profile.'
          });
        await db.query(
          'INSERT INTO interest_list (id, user_id, interest_id) VALUES(DEFAULT, $1, $2)',
          [req.user.id, id]
        );
        res.sendStatus(204);
      })
      .catch(err => next(err));
  } catch (err) {
    next(err);
  }
});

router.delete('/profile/interest', async function(req, res, next) {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  if (!req.body.id)
    return res
      .status(400)
      .json({ error: 'No id (to delete) passed in the body.' });
  try {
    await db.query(
      'DELETE FROM interest_list WHERE user_id = ($1) AND interest_id = ($2)',
      [req.user.id, req.body.id]
    );
    db.query('SELECT FROM interest_list WHERE interest_id = ($1)', [
      req.body.id
    ])
      .then(async inDB => {
        if (inDB.rows.length === 0) {
          await db.query('DELETE FROM interests WHERE id = ($1)', [
            req.body.id
          ]);
        }
      })
      .catch(err => next(err));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async function(req, res, next) {
  try {
    const profile = (await db.query(
      "SELECT bio, gender, sexuality, to_char(birthday, 'YYYY-MM-DD') as birthday, CAST((CURRENT_DATE - birthday) / 365.242199 as FLOAT) as age, country, lat, long FROM profiles WHERE user_id = ($1)",
      [req.user.id]
    )).rows[0];
    if (!profile.lat || !profile.long)
      return res.status(400).send({
        error: 'Missing latitude and longitude, could not process the request.'
      });
    const users = await db.query(
      'WITH top_query as(SELECT 2 * 6371 * asin(sqrt((sin(radians((lat - $2) / 2))) ^ 2 + cos(radians($2)) * cos(radians(lat)) * (sin(radians((long - $3) / 2))) ^ 2)) as distance,\
        users.id, username, first_name, last_name, bio, birthday, country, filename,\
        CASE WHEN likes.id IS NOT NULL\
          THEN TRUE\
          ELSE FALSE\
        END AS liked,\
        CAST((SELECT COUNT(*) FROM likes WHERE dest_uid = users.id) * 3 + (SELECT COUNT(*) FROM visits WHERE dest_uid = users.id) as INTEGER) as popularity,\
        CAST((CURRENT_DATE - birthday) / 365.242199 as FLOAT) as age,\
        CAST((SELECT COUNT(*) FROM interest_list WHERE interest_list.user_id = users.id AND interest_id IN (SELECT interest_id FROM interest_list WHERE user_id = ($4))) as INTEGER) as nbr_common_interest\
        FROM users\
          INNER JOIN profiles ON users.id = profiles.user_id\
          LEFT JOIN images ON users.id = images.user_id AND images.position = 1\
          LEFT JOIN likes ON users.id = likes.dest_uid AND likes.src_uid = ($4)\
        WHERE\
          verified = TRUE AND\
          users.id NOT IN (SELECT dest_uid FROM blockages WHERE src_uid = ($4)) AND\
          gender = ANY($1::int[]) AND\
          users.id != ($4) AND\
          CASE WHEN gender=($5) THEN sexuality IN(2, 3)\
            ELSE sexuality IN(1, 3)\
          END)\
      SELECT -(distance - min_distance) / NULLIF((max_distance - min_distance), 0) * 1.2 +\
      (popularity - min_popularity) / NULLIF(CAST((max_popularity - min_popularity) as FLOAT), 0) * 0.8 +\
      nbr_common_interest * 0.175 - ABS($6 - age) * 0.05 as score, *\
      FROM\
        (SELECT *, (SELECT MAX(distance) FROM top_query) as max_distance, (SELECT MIN(distance) FROM top_query) as min_distance,\
        (SELECT MAX(popularity) FROM top_query) as max_popularity, (SELECT MIN(popularity) FROM top_query) as min_popularity,\
        (SELECT MAX(age) FROM top_query) as max_age, (SELECT MIN(age) FROM top_query) as min_age\
      FROM top_query) top_query ORDER BY score DESC',
      [
        getTargetedGenders(profile.gender, profile.sexuality),
        profile.lat,
        profile.long,
        req.user.id,
        profile.gender,
        profile.age
      ]
    );
    let limits = {};
    if (users.rows.length != 0) {
      limits.max_distance = users.rows[0].max_distance;
      limits.min_distance = users.rows[0].min_distance;
      limits.max_popularity = users.rows[0].max_popularity;
      limits.min_popularity = users.rows[0].min_popularity;
      limits.max_age = users.rows[0].max_age;
      limits.min_age = users.rows[0].min_age;
    }
    const promises = users.rows.map(user => {
      return db
        .query(
          'SELECT * FROM interests WHERE id IN (SELECT interest_id FROM interest_list WHERE user_id = ($1))',
          [user.id],
          false,
          false
        )
        .then(result => {
          user.interests = result.rows;
          delete user.nbr_common_interest;
          delete user.max_distance;
          delete user.min_distance;
          delete user.max_popularity;
          delete user.min_popularity;
          delete user.max_age;
          delete user.min_age;
        });
    });
    await Promise.all(promises);
    res.status(200).send({ users: users.rows, limits });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/location', async function(req, res, next) {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  const lat = parseFloat(req.body.lat);
  const long = parseFloat(req.body.long);
  if (!lat || !long)
    return res.status(400).send({
      error: 'latitude and longitude were not passed in the body.'
    });
  try {
    await db.query(
      'UPDATE profiles SET lat = ($1), long = ($2) WHERE user_id = ($3)',
      [lat, long, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.get('/like/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    if (req.user.id == req.params.user_id)
      return res.status(200).send({ liked: false });
    const inDB = await db.query(
      'SELECT id FROM likes WHERE src_uid = ($1) AND dest_uid = ($2)',
      [req.user.id, req.params.user_id]
    );
    res.status(200).send({ liked: !!inDB.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/block/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    if (req.user.id == req.params.user_id)
      return res.status(200).send({ blocked: false });
    const inDB = await db.query(
      'SELECT id FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
      [req.user.id, req.params.user_id]
    );
    res.status(200).send({ blocked: !!inDB.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/like/:user_id', async function(req, res, next) {
  if (
    !req.params.user_id ||
    !parseInt(req.params.user_id) ||
    req.params.user_id == req.user.id
  )
    return res.sendStatus(400);
  // Block user who does not have a profile picture
  const result = await db.query(
    'SELECT (id) FROM images WHERE user_id = ($1) AND position = 1',
    [req.user.id]
  );
  if (!result.rows[0]) return res.sendStatus(400);
  try {
    const inDB = await db.query(
      'SELECT id FROM likes WHERE src_uid = ($1) AND dest_uid = ($2)',
      [req.user.id, req.params.user_id]
    );
    if (inDB.rows[0]) {
      await db.query(
        'DELETE FROM likes WHERE src_uid = ($1) AND dest_uid = ($2)',
        [req.user.id, req.params.user_id]
      );
      db.query(
        'SELECT id FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
        [req.params.user_id, req.user.id]
      ).then(async inDB => {
        if (!inDB.rows[0]) {
          await db.query(
            "INSERT INTO notifications (src_uid, dest_uid, type) VALUES ($1, $2, 'unlike')",
            [req.user.id, req.params.user_id]
          );
          await db.query(
            "DELETE FROM notifications WHERE id IN (SELECT id FROM notifications WHERE src_uid = ($1) AND dest_uid = ($2) AND type IN ('unlike', 'like', 'match') ORDER BY created_at DESC OFFSET 2)",
            [req.user.id, req.params.user_id]
          );
          if (req.io_users[req.params.user_id])
            req.io_users[req.params.user_id].forEach(socketId =>
              req.io.to(socketId).emit('new-notification')
            );
        }
      });
      res.sendStatus(204);
    } else {
      await db.query('INSERT INTO likes (src_uid, dest_uid) VALUES ($1, $2)', [
        req.user.id,
        req.params.user_id
      ]);
      db.query(
        'SELECT id FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
        [req.params.user_id, req.user.id]
      ).then(inDB => {
        if (!inDB.rows[0])
          db.query(
            'SELECT id FROM likes WHERE src_uid = ($1) AND dest_uid = ($2)',
            [req.params.user_id, req.user.id]
          ).then(res => {
            db.query(
              'INSERT INTO notifications (src_uid, dest_uid, type) VALUES ($1, $2, $3)',
              [req.user.id, req.params.user_id, !res.rows[0] ? 'like' : 'match']
            ).then(() => {
              if (req.io_users[req.params.user_id])
                req.io_users[req.params.user_id].forEach(socketId =>
                  req.io.to(socketId).emit('new-notification')
                );
            });
          });
      });
      res.sendStatus(201);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/notification_count', async function(req, res, next) {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE dest_uid = ($1) AND seen = FALSE',
      [req.user.id]
    );
    res.status(200).send({ count: Number(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

router.post('/block/:user_id', async function(req, res, next) {
  if (
    !req.params.user_id ||
    !parseInt(req.params.user_id) ||
    req.params.user_id == req.user.id
  )
    return res.sendStatus(400);
  try {
    const inDB = await db.query(
      'SELECT id FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
      [req.user.id, req.params.user_id]
    );
    if (inDB.rows[0]) {
      await db.query(
        'DELETE FROM blockages WHERE src_uid = ($1) AND dest_uid = ($2)',
        [req.user.id, req.params.user_id]
      );
      res.sendStatus(204);
    } else {
      db.query('INSERT INTO blockages (src_uid, dest_uid) VALUES ($1, $2)', [
        req.user.id,
        req.params.user_id
      ]);
      res.sendStatus(201);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/popularity/:user_id', async function(req, res, next) {
  try {
    if (!parseInt(req.params.user_id)) return next();
    const likes = await db.query('SELECT id FROM likes WHERE dest_uid = ($1)', [
      req.params.user_id
    ]);
    const visits = await db.query(
      'SELECT id FROM visits WHERE dest_uid = ($1)',
      [req.params.user_id]
    );
    res.status(200).send({ popularity: likes.rowCount * 3 + visits.rowCount });
  } catch (err) {
    next(err);
  }
});

router.put('/user/password', async function(req, res, next) {
  const { old_password, new_password } = req.body;
  const errors = validateInput({
    password: old_password,
    password: new_password
  });
  if (errors.length > 0)
    return res.status(400).json({ error: errors.join(' ') });

  try {
    const user = await db.query('SELECT password FROM users WHERE id = ($1)', [
      req.user.id
    ]);
    const hash = user.rows[0].password;
    const isValid = await bcrypt.compare(old_password, hash);
    if (isValid) {
      bcrypt.hash(new_password, 12, async function(err, hash) {
        if (err) return next(err);
        try {
          await db.query('UPDATE users SET password = ($1) WHERE id = ($2)', [
            hash,
            req.user.id
          ]);
          res.sendStatus(204);
        } catch (err) {
          next(err);
        }
      });
    } else res.status(401).send({ error: 'The password provided is invalid.' });
  } catch (err) {
    next(err);
  }
});

router.get('/profile/visitors', async function(req, res, next) {
  try {
    const visitors = await db.query(
      'SELECT users.id, username, filename FROM users\
        INNER JOIN visits ON users.id = src_uid AND dest_uid = ($1)\
        LEFT JOIN images ON users.id = images.user_id\
          WHERE\
            position = 1\
          ORDER BY visited_at DESC LIMIT 5',
      [req.user.id]
    );
    res.status(200).send(visitors.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/profile/likers', async function(req, res, next) {
  try {
    const likers = await db.query(
      'SELECT users.id, username, filename FROM users\
        INNER JOIN likes ON users.id = src_uid AND dest_uid = ($1)\
        LEFT JOIN images ON users.id = images.user_id\
          WHERE\
            position = 1\
          ORDER BY liked_at DESC LIMIT 5',
      [req.user.id]
    );
    res.status(200).send(likers.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
