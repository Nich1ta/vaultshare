const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function blobPath(id) {
  return path.join(UPLOAD_DIR, id);
}

// Delete the bytes of a file. If it fails, log it and continue
async function removeBlob(id) {
  await fs.promises.unlink(blobPath(id)).catch((err) => console.error(err));
}

module.exports = { UPLOAD_DIR, blobPath, removeBlob };