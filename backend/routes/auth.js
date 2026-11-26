const express = require('express');
const crypto = require('crypto');
const { promisify } = require('util');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);


async function hashLoginKey(loginKey) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(loginKey, salt, 64)).toString('hex');
  return `${salt}:${hash}`;
}

async function verifyLoginKey(loginKey, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = await scrypt(loginKey, salt, 64);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
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


router.post('/login', async (req, res) => {
  const { email, loginKey } = req.body;

  if (!email || !loginKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, login_key_hash, public_key, encrypted_private_key, key_salt
       FROM users WHERE email = ?`,
      [email]
    );
    const user = rows[0];

    
    if (!user || !(await verifyLoginKey(loginKey, user.login_key_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '2h',
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      keySalt: user.key_salt,
      publicKey: user.public_key,
      encryptedPrivateKey: user.encrypted_private_key,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, storage_used, storage_limit, created_at
       FROM users WHERE id = ?`,
      [req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;