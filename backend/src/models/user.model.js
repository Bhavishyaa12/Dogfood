const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email",
      ],
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [6, "Error: Minimum length required is 6"],
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "organizer", "judge", "participant"],
      default: "participant",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
