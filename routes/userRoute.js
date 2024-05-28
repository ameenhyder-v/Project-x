const express = require("express")
const userRoute = express();
const userController = require("../Controller/userController")
const otpContoller = require("../Controller/otpController")

userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.home)

userRoute.get("/registration", userController.register);
userRoute.post("/registration", userController.insertUser);
userRoute.get("/login", userController.userLogin);
userRoute.post("/otpVerify", userController.otpVerify);
userRoute.post("/userVarify", userController.userVarify);
// userRoute.get("/otp", otpContoller.otp);

userRoute.get("/productDetail", userController.productDetails);
userRoute.get("/allProducts", userController.allProducts);
userRoute.get("/shoping-cart", userController.shopingCart);

module.exports = userRoute