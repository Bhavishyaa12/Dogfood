const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
      trim: true,
    },

    ip: {
      type: String,
      required: true,
    },

    userAgent: {
      type: String,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const sessionModel = mongoose.model("session", sessionSchema);

module.exports = sessionModel;
