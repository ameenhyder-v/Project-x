const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/dashboard",adminController.dashboard);

module.exports = adminRoute;
