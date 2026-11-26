const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5678;

app.use(cors());
app.use(express.json()); // read JSON request bodies

// Health check: tells you the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`VaultShare API running on http://localhost:${PORT}`);
});