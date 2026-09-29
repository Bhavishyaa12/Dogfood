const jwt = require("jsonwebtoken");
const config = require("../config/config");

const auth = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let accessToken = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    } else if (req.cookies?.session) {
      accessToken = req.cookies.session;
    }

    if (!accessToken) {
      return res.status(401).json({ success:false, message:"Access token required" });
    }

    const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success:false, message:"Invalid or expired access token" });
  }
};

const roleAuth = function (...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({success:false,message:"Authentication required"});
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({success:false,message:"Forbidden"});
    next();
  };
};

module.exports = { roleAuth, auth };
