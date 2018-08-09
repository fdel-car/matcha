const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const url = require('url');

router.post('/verify', async (req, res, next) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: 'No body passed to make the call.' });
    const { email, token } = req.body;
    const user = await db.query(
      'SELECT verify_token FROM schema.users WHERE email = ($1)', [email]
    );
    if (!user.rows[0]) return res.status(400).json({ error: 'No user associated with this email.' })
    const tokenInDb = user.rows[0].verify_token;
    if (token === tokenInDb) {
      await db.query(
        'UPDATE schema.users SET verified = TRUE, verify_token = NULL WHERE email = ($1)', [email]
      );
      return res.sendStatus(200);
    }
    return res.sendStatus(403);
  } catch (err) {
    next(err)
  }
})

router.post('/users', (req, res, next) => {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  const { username, first_name, last_name, email, password } = req.body;
  bcrypt.hash(password, 12, async function(err, hash) {
    if (err) next(err);
    try {
      const nodemailer = require('nodemailer');
      const uuidv4 = require('uuid/v4');
      let transporter = nodemailer.createTransport({
        sendmail: true
      });
      const token = uuidv4();
      await db.query(
        'INSERT INTO schema.users (id, username, first_name, last_name, email, password, verify_token) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)',
        [username, first_name, last_name, email, hash, token]
      );
      transporter.sendMail(
        {
          from: 'Matcha@love.com',
          to: email,
          subject: 'Verify your account, your love is awaiting 🍑',
          html: `Click <a href="${req.protocol}://${req.get(
            'Host'
          )}/verify?email=${encodeURI(email)}&token=${token}">here</a> to verify your account.`
        },
        (err, info) => {
          if (err) console.error(err.message);
          console.log(info.envelope);
        }
      );
      res
        .status(200)
        .send(`Hi ${username} 👋, you're successfully registered!`);
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

module.exports = router;
