const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR, 
  limits: { fileSize: 100 * 1024 * 1024 }, 
});

function isString(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}


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

  const { encryptedName, folderId = null, mimeType, iv, encryptedKey, sha256 } = meta;
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
      [id, req.userId, folderId, encryptedName, mimeType, size, iv, encryptedKey, sha256],
    );

    await fs.promises.rename(tempPath, path.join(UPLOAD_DIR, id));
    await conn.commit();

    res.status(201).json({
      id, folderId, encryptedName, mimeType, size, iv, encryptedKey, sha256,
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

module.exports = router;