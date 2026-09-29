const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    inviteToken: { type: String, required: true, unique: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Team", teamSchema);
