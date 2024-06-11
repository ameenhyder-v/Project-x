const express = require("express")
const userRoute = express();
const userController = require("../Controller/userController")
const otpContoller = require("../Controller/otpController");
const checkState = require("../middleware/userAuth")
const passport = require("passport");
require("../passport")


userRoute.use(passport.initialize());
userRoute.use(passport.session())
userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.home)

//FOR USER REGISTRATION
userRoute.get("/registration", checkState.isLogout,userController.register);
userRoute.post("/registration", userController.insertUser);
userRoute.post("/otpVerify", userController.otpVerify);
userRoute.get("/resend-otp", checkState.isLogout, otpContoller.resendOtp)


//FOR USER LOGIN
userRoute.get("/login", checkState.isLogout,userController.userLogin);
userRoute.post("/login", userController.userVarify);

//for passport google authentication
userRoute.get("/auth/google", checkState.isLogout, passport.authenticate("google", {scope: ["email", "profile"]}));
userRoute.get("/auth/google/callback", checkState.isLogout, passport.authenticate("google", {successRedirect: "/success", failureRedirect: "/failure"}))
userRoute.get("/success", checkState.isLogout, userController.successGoogleLogin),
userRoute.get("/failure", userController.failureGoolgeLogin)

//FORGOT PASSWORD
userRoute.get("/forget-password", userController.forgetPass);
userRoute.post("/forget-password", otpContoller.forgetPassOtp);
userRoute.post("/forgetOtpVerify", otpContoller.otpVerify);
userRoute.get("/for-resend-otp", checkState.isLogout, otpContoller.forgetResendOtp);
userRoute.get("/change-password", userController.changePassword);
userRoute.post("/change-password", userController.updatePassword);


userRoute.get("/productDetail", userController.productDetails);
userRoute.get("/allProducts", userController.allProducts);
userRoute.get("/shoping-cart", userController.shopingCart);

module.exports = userRoute