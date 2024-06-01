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

userRoute.get("/registration", checkState.isLogout,userController.register);
userRoute.post("/registration", userController.insertUser);
userRoute.get("/login", checkState.isLogout,userController.userLogin);
userRoute.post("/otpVerify", userController.otpVerify);
userRoute.get("/resend-otp", checkState.isLogout, otpContoller.resendOtp )
userRoute.post("/login", userController.userVarify);

//for passport google authentication
userRoute.get("/auth/google", passport.authenticate("google", {scope: ["email", "profile"]}));
userRoute.get("/auth/google/callback", passport.authenticate("google", {successRedirect: "/success", failureRedirect: "/failure"}))
userRoute.get("/success", userController.successGoogleLogin),
userRoute.get("/failure", userController.failureGoolgeLogin)

// userRoute.get("/otp", otpContoller.otp);

userRoute.get("/productDetail", userController.productDetails);
userRoute.get("/allProducts", userController.allProducts);
userRoute.get("/shoping-cart", userController.shopingCart);

module.exports = userRoute