const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function isString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}


async function getMembership(groupId, userId) {
  const [rows] = await pool.query(
    "SELECT role, status FROM group_members WHERE group_id = ? AND user_id = ?",
    [groupId, userId],
  );
  return rows[0] || null;
}


router.post("/", async (req, res) => {
  const { encryptedName, encryptedGroupKey } = req.body;
  if (!isString(encryptedName, 2048) || !isString(encryptedGroupKey, 4096)) {
    return res.status(400).json({ error: "Invalid encryptedName or encryptedGroupKey" });
  }

  const id = "g_" + crypto.randomBytes(6).toString("hex");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "INSERT INTO `groups` (id, owner_id, encrypted_name) VALUES (?, ?, ?)",
      [id, req.userId, encryptedName],
    );
    
    await conn.query(
      `INSERT INTO group_members (group_id, user_id, role, status, encrypted_group_key)
       VALUES (?, ?, 'owner', 'active', ?)`,
      [id, req.userId, encryptedGroupKey],
    );
    await conn.commit();

    res.status(201).json({
      id,
      encryptedName,
      keyVersion: 1,
      role: "owner",
      status: "active",
      encryptedGroupKey,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});


router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.id, g.encrypted_name AS encryptedName, g.key_version AS keyVersion,
              m.role, m.status, m.encrypted_group_key AS encryptedGroupKey,
              g.created_at AS createdAt
       FROM \`groups\` g
       JOIN group_members m ON m.group_id = g.id
       WHERE m.user_id = ?
       ORDER BY g.created_at`,
      [req.userId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const me = await getMembership(req.params.id, req.userId);
    if (!me) return res.status(404).json({ error: "Group not found" });

    const [groupRows] = await pool.query(
      `SELECT id, owner_id AS ownerId, encrypted_name AS encryptedName,
              key_version AS keyVersion, created_at AS createdAt
       FROM \`groups\` WHERE id = ?`,
      [req.params.id],
    );
    const [members] = await pool.query(
      `SELECT u.id AS userId, u.name, m.role, m.status, m.joined_at AS joinedAt
       FROM group_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = ?
       ORDER BY m.joined_at`,
      [req.params.id],
    );
    const [mine] = await pool.query(
      "SELECT encrypted_group_key AS encryptedGroupKey FROM group_members WHERE group_id = ? AND user_id = ?",
      [req.params.id, req.userId],
    );

    res.json({
      ...groupRows[0],
      myRole: me.role,
      myStatus: me.status,
      encryptedGroupKey: mine[0].encryptedGroupKey, 
      members,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const me = await getMembership(req.params.id, req.userId);
    if (!me) return res.status(404).json({ error: "Group not found" });
    if (me.role !== "owner") {
      return res.status(403).json({ error: "Only the owner can delete the group" });
    }

    await pool.query("DELETE FROM `groups` WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { router, getMembership };