const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NPR",
      enum: ["NPR"], // Restrict to NPR for Khalti
    },
    khaltiTransactionId: {
      type: String,
      required: true, // Always required since Khalti generates pidx
      unique: true, // Ensures uniqueness for Khalti pidx
    },
    khaltiPaymentUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "khalti",
      enum: ["khalti"], // Restrict to khalti for now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
paymentSchema.index({ user: 1, event: 1 }); // For checking existing registrations

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);