const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5678;

app.use(cors());
app.use(express.json());

// Health check: is the server running, and can it reach the database?
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', database: 'unreachable' });
  }
});

app.listen(PORT, () => {
  console.log(`VaultShare API running on http://localhost:${PORT}`);
});