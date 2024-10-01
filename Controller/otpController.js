
// const { text } = require("body-parser");
// const OTP = require("../Model/otpModel");
const User = require("../Model/userModel");
const nodemailer = require("nodemailer");
const SendmailTransport = require("nodemailer/lib/sendmail-transport");
const otpModel = require("../Model/otpModel");
require("dotenv").config();


const sendMail = async (email) => {

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



//RESENDING OTP FUNCTION
const resendOtp = async (req, res) => {
  try {
    email = req.session.email

    const otpp = await sendMail(email);
    const otp = parseInt(otpp);
    console.log(otp);
    // console.log(otpp);

    const existOtp = await otpModel.findOneAndDelete({ emailId: email });
    const save = new otpModel({
      emailId: email,
      otp: otp,
    });

    const saveOtp = await save.save();
    if (saveOtp) {
      console.log("saved")
      // console.log(email)
      req.session.email = email;
      res.render("otp", { email: email });
      // console.log(req.session.email)

    }

  } catch (error) {
    console.log(`Error from the otpController.resendOtp ${error.message}`)

  }
}


function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
};




//FORGOT OTP PAGE RENDERING
const forgetPassOtp = async (req, res) => {
  try {

    const { email } = req.body
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      req.flash("message", "Invalid email format.")
      return res.redirect("/forget-password");
    }

    const checkExists = await User.findOne({ email: email });
  
    if (!checkExists){
      console.log("-----------------------")
      req.flash("message", "Account not find Register insted")
      return res.redirect("/login");
    }

    const sendingOtp = await sendMail(email)
    const otp = parseInt(sendingOtp)
    console.log(otp)
    // console.log(email)

    const existOtp = await otpModel.findOneAndDelete({ emailId: email });

    const save = new otpModel({
      emailId: email,
      otp: otp,
    });

    const saveOtp = await save.save();
    if (saveOtp) {

      console.log("saved")
      req.session.email = email;
      res.render("forgetOtp", {email: email});

      }
      

  } catch (error) {
    console.log(`error from the otpController. forgetOtp rendering: ${error}`)
  }
}


//RESENDING OTP for forget FUNCTION
const forgetResendOtp = async (req, res) => {
  try {
    email = req.session.email

    const otpp = await sendMail(email);
    const otp = parseInt(otpp);
    console.log(otp);
    // console.log(otpp);

    const existOtp = await otpModel.findOneAndDelete({ emailId: email });
    const save = new otpModel({
      emailId: email,
      otp: otp,
    });

    const saveOtp = await save.save();
    if (saveOtp) {
      console.log("saved")
      // console.log(email)
      req.session.email = email;
      res.render("forgetOtp", { email: email });

    }

  } catch (error) {
    console.log(`Error from the otpController.resendOtp ${error.message}`)

  }
}

//FORGET OTP VARIFICATION
const otpVerify = async (req, res) => {
  try {
    const OTP = req.body.otp;
    const email = req.session.email;

    console.log('otp oppp', OTP);

    const findOtp = await otpModel.findOne({ emailId: email });

    if (!findOtp) {
      return res.status(404).send({ status: 0, message: "OTP not found for this email." });
    }

    if (OTP !== findOtp.otp) {
      return res.send({ status: 0 });
    } else {
      return res.send({ status: 1 });
    }

  } catch (error) {
    console.log(`error form the otpController .otpVarify: ${error}`);
    res.status(500).send({ status: 0, message: "Internal server error" });
  }
}



module.exports = {
  sendMail,
  resendOtp,
  forgetPassOtp,
  otpVerify,
  forgetResendOtp
}
