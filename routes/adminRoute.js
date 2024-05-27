const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/yes", adminController.adminLogin);

adminRoute.get("/dashboard",adminController.dashboard);
adminRoute.get("/productList", adminController.productList);
adminRoute.get("/orders", adminController.orders);

module.exports = adminRoute;
