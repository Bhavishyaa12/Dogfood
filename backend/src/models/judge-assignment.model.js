const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
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
    invited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["assigned", "completed"],
      default: "assigned",
    },
  },
  { timestamps: true, versionKey: false },
);

assignmentSchema.index({ event: 1, judge: 1, project: 1 }, { unique: true });

module.exports = mongoose.model("JudgeAssignment", assignmentSchema);
