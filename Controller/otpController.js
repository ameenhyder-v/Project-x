
// const { text } = require("body-parser");
// const OTP = require("../Model/otpModel");
// const User = require("../Model/userModel");
const nodemailer = require("nodemailer");
const SendmailTransport = require("nodemailer/lib/sendmail-transport");
const otpModel = require("../Model/otpModel");
require("dotenv").config();


const sendMail = (email) => {

  const otp = generateOTP()
  console.log(email);
  console.log(otp);
  const transproter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "This is your otp for varification",
    text: `This is your otp: ${otp}`,
    html: `Try this otp to register ${otp}`,
  };
  // console.log("-----------------------------------------------")
  // console.log(process.env.EMAIL_USER);
  // console.log(process.env.EMAIL_PASS)
  //   console.log("-----------------------------------------------");

  transproter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`error from otp controller: ${error}`)
    } else {
      console.log(`no error while sennding mail ${info.response}`)

    }

  })
  return otp;
}


const resendOtp = async (req, res) => {

  try {
    email = req.session.email

    const otpp = sendMail(email);
    const otp = parseInt(otpp);
    console.log(otp);
    // console.log(otpp);

    const existOtp = await otpModel.findOneAndDelete({ emailId: email });
    const save = new otpModel({
      emailId: email,
      otp: otp,
    });

    const saveOtp = await save.save();
    if(saveOtp){
      console.log("saved")
      // console.log(email)
      req.session.email = email;
      res.render("otp", { email: email });
      console.log(req.session.email)
      
    }
    
  } catch (error) {
      console.log(`Error from the otpController.resendOtp ${error.message}`)

  }
}


function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
};


module.exports = {
  sendMail,
  resendOtp
}
