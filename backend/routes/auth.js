const express = require('express');
const crypto = require('crypto');
const { promisify } = require('util');
const pool = require('../db');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);


async function hashLoginKey(loginKey) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(loginKey, salt, 64)).toString('hex');
  return `${salt}:${hash}`;
}


router.post('/register', async (req, res) => {
  const { name, email, loginKey, publicKey, encryptedPrivateKey, keySalt } = req.body;

  if (!name || !email || !loginKey || !publicKey || !encryptedPrivateKey || !keySalt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = 'u_' + crypto.randomBytes(6).toString('hex');

  try {
    const loginKeyHash = await hashLoginKey(loginKey);

    await pool.query(
      `INSERT INTO users (id, name, email, login_key_hash, public_key, encrypted_private_key, key_salt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, loginKeyHash, publicKey, encryptedPrivateKey, keySalt]
    );

    res.status(201).json({ id, name, email, createdAt: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;