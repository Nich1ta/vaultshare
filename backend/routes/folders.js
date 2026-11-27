const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function validEncryptedName(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 2048;
}

router.get("/", async (req, res) => {
  const parentId = req.query.parentId || null;
  if (parentId !== null && typeof parentId !== "string") {
    return res.status(400).json({ error: "Invalid parentId" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, parent_id AS parentId, encrypted_name AS encryptedName, created_at AS createdAt
        FROM folders
        WHERE owner_id = ? AND parent_id <=> ?
        ORDER BY created_at`,
      [req.userId, parentId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { encryptedName, parentId = null } = req.body;
  if (!validEncryptedName(encryptedName)) {
    return res.status(400).json({ error: "Invalid encryptedName" });
  }
  if (parentId !== null && typeof parentId !== "string") {
    return res.status(400).json({ error: "Invalid parentId" });
  }

  try {
    if (parentId) {
      const [parent] = await pool.query(
        "SELECT id FROM folders WHERE id = ? AND owner_id = ?",
        [parentId, req.userId],
      );
      if (!parent[0])
        return res.status(404).json({ error: "Parent folder not found" });
    }

    const id = "fo_" + crypto.randomBytes(6).toString("hex");
    await pool.query(
      "INSERT INTO folders (id, owner_id, parent_id, encrypted_name) VALUES (?, ?, ?, ?)",
      [id, req.userId, parentId, encryptedName],
    );
    res.status(201).json({
      id,
      parentId,
      encryptedName,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const { encryptedName } = req.body;
  if (!validEncryptedName(encryptedName)) {
    return res.status(400).json({ error: "Invalid encryptedName" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE folders SET encrypted_name = ? WHERE id = ? AND owner_id = ?",
      [encryptedName, req.params.id, req.userId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Folder not found" });
    res.json({ id: req.params.id, encryptedName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM folders WHERE id = ? AND owner_id = ?",
      [req.params.id, req.userId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Folder not found" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
