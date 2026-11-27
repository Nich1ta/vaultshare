const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function validName(name) {
  return (
    typeof name === "string" && name.trim().length > 0 && name.length <= 255
  );
}

router.get("/", async (req, res) => {
  const parentId = req.query.parentId || null;
  if (parentId !== null && typeof parentId !== "string") {
    return res.status(400).json({ error: "Invalid parentId" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, parent_id AS parentId, name, created_at AS createdAt
       FROM folders
       WHERE owner_id = ? AND parent_id <=> ?
       ORDER BY name`,
      [req.userId, parentId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { name, parentId = null } = req.body;
  if (!validName(name)) {
    return res.status(400).json({ error: "Invalid name" });
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
      "INSERT INTO folders (id, owner_id, parent_id, name) VALUES (?, ?, ?, ?)",
      [id, req.userId, parentId, name.trim()],
    );
    res.status(201).json({
      id,
      parentId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  if (!validName(name)) {
    return res.status(400).json({ error: "Invalid name" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE folders SET name = ? WHERE id = ? AND owner_id = ?",
      [name.trim(), req.params.id, req.userId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Folder not found" });
    res.json({ id: req.params.id, name: name.trim() });
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
