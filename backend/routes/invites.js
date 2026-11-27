const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/auth");
const { verifyInvite } = require("../invite-signature");

const router = express.Router();
router.use(requireAuth);


router.post("/:id/accept", async (req, res) => {
  const { signature } = req.body;
  if (typeof signature !== "string" || signature.length === 0) {
    return res.status(400).json({ error: "Invalid invite" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    
    const [rows] = await conn.query(
      `SELECT id, group_id AS groupId, email, role, used_at AS usedAt,
              expires_at < NOW() AS expired
       FROM invites WHERE id = ? FOR UPDATE`,
      [req.params.id],
    );
    const invite = rows[0];

    
    if (!invite || !verifyInvite(invite, signature)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid invite" });
    }
    if (invite.usedAt || invite.expired) {
      await conn.rollback();
      return res.status(410).json({ error: "Invite expired or already used" });
    }

    
    const [users] = await conn.query("SELECT email FROM users WHERE id = ?", [req.userId]);
    if (!users[0] || users[0].email !== invite.email) {
      await conn.rollback();
      return res.status(403).json({ error: "This invite is for another account" });
    }

    const [existing] = await conn.query(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
      [invite.groupId, req.userId],
    );
    if (existing[0]) {
      await conn.rollback();
      return res.status(409).json({ error: "Already a member" });
    }

    
    await conn.query(
      `INSERT INTO group_members (group_id, user_id, role, status)
       VALUES (?, ?, ?, 'pending_key')`,
      [invite.groupId, req.userId, invite.role],
    );
    await conn.query("UPDATE invites SET used_at = NOW() WHERE id = ?", [invite.id]);
    await conn.commit();

    res.json({ groupId: invite.groupId, role: invite.role, status: "pending_key" });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

module.exports = router;