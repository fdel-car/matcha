const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');
const validateInput = require('./validate_input');

function generateToken() {
  const nodemailer = require('nodemailer');
  const uuidv4 = require('uuid/v4');
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
      html: `Click <a href="${req.protocol}://localhost:3000/verify?email=${encodeURI(email)}&token=${token}">here</a> to verify your account.`
    },
    (err, info) => {
      if (err) console.error(err.message);
      console.log(info.envelope);
      transporter.close();
    }
  );
}

router.post('/verify', async (req, res, next) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: 'No body passed to make the call.' });
    const { email, token } = req.body;
    const messages = validateInput({ email });
    if (messages.length > 0) return res.status(400).json({ error: messages.join(' ') });
    const user = await db.query(
      'SELECT verify_token, verified FROM schema.users WHERE email = ($1)', [email]
    );
    if (!user.rows[0]) return res.status(400).json({ error: 'No user associated with this email.' })
    const { verify_token, verified } = user.rows[0];
    if (verified) return res.status(403).json({ error: 'This email address has already been verified.' })
    if (token === verify_token) {
      await db.query(
        'UPDATE schema.users SET verified = TRUE, verify_token = NULL WHERE email = ($1)', [email]
      );
      return res.sendStatus(200);
    }
    return res.status(403).json({ error: 'This token is outdated and / or invalid.' })
  } catch (err) {
    next(err)
  }
})

router.post('/verify/resend_email', async (req, res, next) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: 'No body passed to make the call.' });
    const { email } = req.body;
    const messages = validateInput({ email });
    if (messages.length > 0) return res.status(400).json({ error: messages.join(' ') });
    const user = await db.query(
      'SELECT verified FROM schema.users WHERE email = ($1)', [email]
    );
    if (!user.rows[0]) return res.status(400).json({ error: 'No user associated with this email.' })
    const verified = user.rows[0].verified;
    if (verified) return res.status(403).json({ error: 'The user associated with this email is already verified.' })
    const { transporter, token } = generateToken();
    await db.query(
      'UPDATE schema.users SET verify_token = ($2) WHERE email = ($1)', [email, token]
    );
    sendMail(transporter, req, email, token);
    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
})

router.post('/users', (req, res, next) => {
  if (!req.body)
    return res.status(400).json({ error: 'No body passed to make the call.' });
  const { username, first_name, last_name, email, password } = req.body;

  const messages = validateInput({ username, first_name, last_name, email, password });

  if (messages.length > 0) return res.status(400).json({ error: messages.join(' ') });
  bcrypt.hash(password, 12, async function(err, hash) {
    if (err) next(err);
    try {
      const { transporter, token } = generateToken();
      await db.query(
        'INSERT INTO schema.users (id, username, first_name, last_name, email, password, verify_token) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)',
        [username, first_name, last_name, email, hash, token]
      );
      sendMail(transporter, req, email, token);
      res
        .status(200)
        .send(`Hi ${username} 👋, you're successfully registered! A confirmation email has been sent to ${email}.`);
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
