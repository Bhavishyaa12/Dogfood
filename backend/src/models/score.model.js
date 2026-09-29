const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    criteria: { type: mongoose.Schema.Types.Mixed, required: true },
    raw_total: { type: Number, required: true, min: 0, max: 5 },
    normalized_total: { type: Number, min: 0, max: 5 },
    comment: { type: String, default: "" },
    submitted_at: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

scoreSchema.index({ event: 1, judge: 1, project: 1 }, { unique: true });

module.exports = mongoose.model("Score", scoreSchema);
