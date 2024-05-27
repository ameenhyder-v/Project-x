const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/yes", adminController.adminLogin);

adminRoute.get("/dashboard",adminController.dashboard);
adminRoute.get("/productList", adminController.productList);
adminRoute.get("/addProduct" , adminController.addProduct)
adminRoute.get("/orders", adminController.orders);
adminRoute.get("/users", adminController.allUsers);
adminRoute.get("/userDetails", adminController.userDetails);
adminRoute.get("/categories", adminController.categories);

module.exports = adminRoute;
