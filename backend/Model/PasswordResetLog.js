const mongoose = require("mongoose");

const passwordResetLogSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    resetDate: {
      type: Date,
      default: Date.now,
    },
    generatedPassword: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PasswordResetLog", passwordResetLogSchema);
