const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [4, "Name should have more than 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"], 
  },

  password: {
    type: String,
    required: [true, "Please Enter Your Password"],
    minLength: [8, "Password should have more than 4 characters"],
    select: false, 
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Hash password
userSchema.pre("save", async function (next) {

  if (this.isModified("password") === false) {
    next();
  }
  // if password upadated or created then ....
  this.password = await bcrypt.hash(this.password, 10); // this points to individule user
});

// Generate JWT Token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate Refresh Token
userSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

// Compare Password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password); // this function will cheack when user login with palin password and bcrypt.compare will cheack that password with hashed password in DataBase.
};

// Generate Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token for reset password just like otp kinda of
  const resetPassToken = crypto.randomBytes(20).toString("hex"); // crypto.randomBytes will create random bytes of bufffer value toString("hex") will convert that buffer inot hex string
  // Hashing and adding resetPasswordToken to userSchema

  // resetPasswordToken and  resetPasswordExpire are user schema definde over now we adding value resetPassToken token  and expiry of that token . when user will try resetpass  then resetPasswordToken and resetPasswordExpire will store and also reset token send through nodmailer to user and when user add that token . if token will match then he will able to rseet pass
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetPassToken)
    .toString("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //  resetPasswordExpire : it will make sure how much time this reset token will valid for reseting pass eg 5 min or 3min

  return resetPassToken;
};

const userModel = mongoose.model("userModel", userSchema);
module.exports = userModel;
