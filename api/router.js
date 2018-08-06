const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.post('/users', async (req, res) => {
  try {
    // Verify all input before using them, encrypt the password with bcrypt
    await db.query(
      'INSERT INTO schema.users (id, username, first_name, last_name, email, password) VALUES (DEFAULT, $1, $2, $3, $4, $5)',
      [
        req.body.username,
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.password
      ]
    );
    res.sendStatus(200);
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

module.exports = router;
