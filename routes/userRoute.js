const express = require("express")
const userRoute = express();
const userController = require("../Controller/userController")

userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.home)
userRoute.get("/registration", userController.register);
userRoute.get("/productDetail", userController.productDetails);
userRoute.get("/login", userController.userLogin);
userRoute.get("/allProducts", userController.allProducts);
userRoute.get("/shoping-cart", userController.shopingCart);

userRoute.get("/otp", userController.otp)

module.exports = userRoute