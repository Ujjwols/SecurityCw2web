const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "cancelled", "attended", "no_show"],
      default: "registered",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    attendedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure unique registration per user per event
eventRegistrationSchema.index({ user: 1, event: 1 }, { unique: true });
eventRegistrationSchema.index({ status: 1 });
eventRegistrationSchema.index({ registrationDate: 1 });

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema); 