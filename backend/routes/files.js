const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const { UPLOAD_DIR, blobPath, removeBlob } = require("../storage");

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 100 * 1024 * 1024 },
});

function isString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}
const FILE_COLUMNS = `id, folder_id AS folderId, encrypted_name AS encryptedName,
  mime_type AS mimeType, size, iv, encrypted_key AS encryptedKey, sha256,
  created_at AS createdAt`;

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing file" });
  const tempPath = req.file.path;

  const fail = async (status, error) => {
    await fs.promises.unlink(tempPath).catch(() => {});
    return res.status(status).json({ error });
  };

  let meta;
  try {
    meta = JSON.parse(req.body.metadata);
  } catch {
    return fail(400, "Invalid metadata");
  }
  if (!meta || typeof meta !== "object") return fail(400, "Invalid metadata");

  const {
    encryptedName,
    folderId = null,
    mimeType,
    iv,
    encryptedKey,
    sha256,
  } = meta;
  if (
    !isString(encryptedName, 2048) ||
    !isString(mimeType, 100) ||
    !isString(iv, 64) ||
    !isString(encryptedKey, 4096) ||
    !/^[0-9a-f]{64}$/.test(sha256) ||
    (folderId !== null && typeof folderId !== "string")
  ) {
    return fail(400, "Invalid metadata");
  }

  try {
    const bytes = await fs.promises.readFile(tempPath);
    const actual = crypto.createHash("sha256").update(bytes).digest("hex");
    if (actual !== sha256) return fail(400, "Hash mismatch");
  } catch (err) {
    console.error(err);
    return fail(500, "Server error");
  }

  const id = "fi_" + crypto.randomBytes(6).toString("hex");
  const size = req.file.size;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    if (folderId) {
      const [folder] = await conn.query(
        "SELECT id FROM folders WHERE id = ? AND owner_id = ?",
        [folderId, req.userId],
      );
      if (!folder[0]) {
        await conn.rollback();
        return fail(404, "Folder not found");
      }
    }

    const [quota] = await conn.query(
      `UPDATE users SET storage_used = storage_used + ?
       WHERE id = ? AND storage_used + ? <= storage_limit`,
      [size, req.userId, size],
    );
    if (quota.affectedRows === 0) {
      await conn.rollback();
      return fail(403, "Storage limit exceeded");
    }

    await conn.query(
      `INSERT INTO files (id, owner_id, folder_id, encrypted_name, mime_type, size, iv, encrypted_key, sha256)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.userId,
        folderId,
        encryptedName,
        mimeType,
        size,
        iv,
        encryptedKey,
        sha256,
      ],
    );

    await fs.promises.rename(tempPath, blobPath(id));
    await conn.commit();

    res.status(201).json({
      id,
      folderId,
      encryptedName,
      mimeType,
      size,
      iv,
      encryptedKey,
      sha256,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    return fail(500, "Server error");
  } finally {
    conn.release();
  }
});

router.get("/", async (req, res) => {
  const folderId = req.query.folderId || null;
  if (folderId !== null && typeof folderId !== "string") {
    return res.status(400).json({ error: "Invalid folderId" });
  }

  try {
    if (folderId) {
      const [folder] = await pool.query(
        "SELECT id FROM folders WHERE id = ? AND owner_id = ?",
        [folderId, req.userId],
      );
      if (!folder[0])
        return res.status(404).json({ error: "Folder not found" });
    }

    const [rows] = await pool.query(
      `SELECT ${FILE_COLUMNS} FROM files
       WHERE owner_id = ? AND folder_id <=> ?
       ORDER BY created_at`,
      [req.userId, folderId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${FILE_COLUMNS} FROM files WHERE id = ? AND owner_id = ?`,
      [req.params.id, req.userId],
    );
    if (!rows[0]) return res.status(404).json({ error: "File not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/content", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM files WHERE id = ? AND owner_id = ?",
      [req.params.id, req.userId],
    );
    if (!rows[0]) return res.status(404).json({ error: "File not found" });

    res.set("Content-Type", "application/octet-stream");
    res.set("X-Content-Type-Options", "nosniff");
    res.sendFile(blobPath(rows[0].id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT id, size FROM files WHERE id = ? AND owner_id = ? FOR UPDATE",
      [req.params.id, req.userId],
    );
    if (!rows[0]) {
      await conn.rollback();
      return res.status(404).json({ error: "File not found" });
    }

    await conn.query("DELETE FROM files WHERE id = ?", [rows[0].id]);
    await conn.query(
      "UPDATE users SET storage_used = storage_used - ? WHERE id = ?",
      [rows[0].size, req.userId],
    );
    await conn.commit();

    await removeBlob(rows[0].id); // only after the DB is updated
    res.status(204).end();
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});
module.exports = router;
