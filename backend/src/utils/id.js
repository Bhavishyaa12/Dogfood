const crypto = require("crypto");

const shortId = (prefix) =>
  `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
const token = () => crypto.randomBytes(24).toString("hex");

module.exports = { shortId, token };
