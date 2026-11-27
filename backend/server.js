const express = require("express");
const cors = require("cors");
const pool = require("./db");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to backend/.env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5678;

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/folders", require("./routes/folders"));
app.use("/api/files", require("./routes/files"));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`VaultShare API running on http://localhost:${PORT}`);
});