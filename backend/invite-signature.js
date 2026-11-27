const crypto = require("crypto");


function signInvite(invite) {
  const data = `${invite.id}.${invite.groupId}.${invite.email}.${invite.role}`;
  return crypto.createHmac("sha256", process.env.INVITE_SECRET).update(data).digest("hex");
}


function verifyInvite(invite, signature) {
  const expected = Buffer.from(signInvite(invite), "hex");
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

module.exports = { signInvite, verifyInvite };