const express = require("express")
const userRoute = express();
const userController = require("../Controller/userController")

userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.register);

module.exports = userRoute