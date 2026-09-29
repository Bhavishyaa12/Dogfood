const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    team: { type: String, required: true },
    teamRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    track: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "" },
    repo_url: { type: String, default: "" },
    submitted_at: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "submitted",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true, collection: "projects", versionKey: false },
);

module.exports = mongoose.model("Project", projectSchema);
