const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    judge: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("JudgeInvitation", invitationSchema);
