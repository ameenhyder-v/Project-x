const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");
const categoryController = require("../Controller/categoryController");
const productController = require("../Controller/productController")
const variantController = require('../Controller/variantController');
const upload = require('../middleware/multer');

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/login", adminController.adminLogin);
adminRoute.post("/login", adminController.verifyAdmin);


adminRoute.put("/blockUser", adminController.userControl);


adminRoute.get("/dashboard",adminController.dashboard);

adminRoute.get("/productList", adminController.productList);


adminRoute.get("/addProduct" , adminController.addProduct)
adminRoute.post("/adding-product", productController.addingProduct)
adminRoute.get("/remove-product", productController.removeProductVariantFalse)




adminRoute.get("/check-category", categoryController.checkCategory)
adminRoute.get("/orders", adminController.orders);
adminRoute.get("/users", adminController.allUsers);
adminRoute.get("/userDetails", adminController.userDetails);


adminRoute.get("/categories", adminController.categories);
adminRoute.post("/addCategory", categoryController.updateCategory);
adminRoute.get("/delete-category", categoryController.deleteCategory)


//ADD VARIANT
adminRoute.post('/add-variant', upload.any(),variantController.addVriant);

//VARIANT PAGE LOAD
adminRoute.get("/load-variant", variantController.loadVariant)

//EDIT VARIANT
adminRoute.get("/edit-variant", variantController.editVariant)

adminRoute.post('/block-product',productController.blockProduct)

module.exports = adminRoute;
