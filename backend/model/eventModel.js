const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      lowercase: true,
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (24-hour)"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [3, "Location must be at least 3 characters"],
    },
    files: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, required: true },
        },
      ],
      validate: {
        validator: function (value) {
          return value.length <= 10;
        },
        message: "You can only upload up to 10 files",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);