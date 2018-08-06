const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcrypt');

router.post('/users', (req, res) => {
  if (!req.body) return res.status(400).json({ error: 'No body passed to make the call.' })
  const { username, first_name, last_name, email, password } = req.body;
  bcrypt.hash(password, 12, async function(err, hash) {
    if (err) throw err;
    try {
      await db.query(
        'INSERT INTO schema.users (id, username, first_name, last_name, email, password) VALUES (DEFAULT, $1, $2, $3, $4, $5)',
        [username, first_name, last_name, email, hash]
      );
      res.status(200).send(`Hi ${username} 👋, you're successfully registered!`);
    } catch (err) {
      // For now it only get the first error, I want them all
      if (err.code == 23505) {
        const fieldName = (err.detail.match(/Key \(([a-z,_]*?)\)=/) || [])[1];
        error = `This ${fieldName} is already taken.`;
        return res.status(400).json({ error, fieldName });
      }
      res.sendStatus(500);
    }
  });
});

module.exports = router;
