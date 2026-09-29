const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const config = require("../config/config");

const REFRESH_TOKEN_EXPIRES = 7 * 24 * 60 * 60 * 1000;

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createAccessToken = (userId, sessionId, role) => {
  return jwt.sign(
    {
      userId,
      sessionId,
      role,
    },
    config.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    },
  );
};

const createRefreshToken = (userId, sessionId, role) => {
  return jwt.sign(
    {
      userId,
      sessionId,
      role,
    },
    config.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_EXPIRES,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
};

const registerUser = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const session = await sessionModel.create({
      user: user._id,
      refreshToken: "pending",
      ip: req.ip,
      userAgent: req.get("user-agent") || "Unknown",
      revoked: false,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES),
    });

    const refreshToken = createRefreshToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    session.refreshToken = hashRefreshToken(refreshToken);

    await session.save();

    const accessToken = createAccessToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    console.error("Registration error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const session = await sessionModel.create({
      user: user._id,
      refreshToken: "pending",
      ip: req.ip,
      userAgent: req.get("user-agent") || "Unknown",
      revoked: false,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES),
    });

    const refreshToken = createRefreshToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    session.refreshToken = hashRefreshToken(refreshToken);

    await session.save();

    const accessToken = createAccessToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "User logged in",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      revoked: false,
    });

    if (!session) {
      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message: "Invalid or revoked session",
      });
    }

    if (session.expiresAt < new Date()) {
      session.revoked = true;

      await session.save();

      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    const incomingHash = hashRefreshToken(refreshToken);

    if (incomingHash !== session.refreshToken) {
      session.revoked = true;

      await session.save();

      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message: "Refresh token reuse detected",
      });
    }

    const user = await userModel.findById(session.user);

    if (!user) {
      session.revoked = true;

      await session.save();

      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message: "Invalid session",
      });
    }

    const newRefreshToken = createRefreshToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    session.refreshToken = hashRefreshToken(newRefreshToken);

    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES);

    await session.save();

    const newAccessToken = createAccessToken(
      user._id.toString(),
      session._id.toString(),
      user.role,
    );

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (err) {
    clearRefreshCookie(res);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Already logged out",
      });
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const session = await sessionModel.findOne({
      refreshToken: tokenHash,
      revoked: false,
    });

    if (!session) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid or already logged out session",
      });
    }

    session.revoked = true;

    await session.save();

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
