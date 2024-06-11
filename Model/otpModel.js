
const mongoose = require("mongoose");


const otpSchema = new mongoose.Schema({
  emailId: { 
    type: String,
     required: true
     },
  otp: {
     type: Number,
      required: true 
    },
  createdAt: { 
    type: Date, 
    required: true, 
    default: Date.now() 
    },
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 130 });

module.exports = mongoose.model("OTP", otpSchema);