const mongoose = require("mongoose");

const criterionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    weight: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const trackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const prizeSchema = new mongoose.Schema(
  {
    place: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    starts_at: { type: Date, required: true },
    submissions_close: { type: Date, required: true },
    judging_close: { type: Date, required: true },
    tracks: { type: [trackSchema], default: [] },
    prizes: { type: [prizeSchema], default: [] },
    rubric: { type: [criterionSchema], default: [] },
    normalization: {
      method: { type: String, default: "per-judge-z-score" },
      documented: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["draft", "open", "judging", "closed"],
      default: "draft",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Event", eventSchema);
