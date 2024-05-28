
// const { text } = require("body-parser");
// const OTP = require("../Model/otpModel");
// const User = require("../Model/userModel");
const nodemailer = require("nodemailer");
const SendmailTransport = require("nodemailer/lib/sendmail-transport");
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
    if(error){
      console.log(`error from otp controller: ${error}`)
    }else{
      console.log(`no error while sennding mail ${info.response}`)

    }

  })
  return otp;

}




function generateOTP(){
  return Math.floor(1000 + Math.random() * 9000).toString(); 
};


module.exports = {
    sendMail,
}