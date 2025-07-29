const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const encrypt = require("mongoose-encryption");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["admin", "user", "organizer"],
      default: "user",
    },
    refreshToken: {
      type: String,
    },
    profilePic: {
      type: String,
      default: "",
    },
    passwordHistory: [
      {
        password: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    passwordAttempts: {
      type: Number,
      default: 0,
    },
    passwordLastReset: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Encrypt email and refreshToken fields
userSchema.plugin(encrypt, {
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
  signingKey: process.env.DB_SIGNING_KEY,
  encryptedFields: ["refreshToken"],
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email, // Automatically decrypted by mongoose-encryption
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.methods.isPasswordInHistory = async function (newPassword) {
  for (const entry of this.passwordHistory.slice(-2)) {
    if (await bcrypt.compare(newPassword, entry.password)) {
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);