const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");
const categoryController = require("../Controller/categoryController");
const productController = require("../Controller/productController")
const variantController = require('../Controller/variantController');
const upload = require('../middleware/multer');
// const multer = require("multer");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/login", adminController.adminLogin);
adminRoute.post("/login", adminController.verifyAdmin);


adminRoute.get("/dashboard",adminController.dashboard);


//PRODUCTLIST PAGE RENDERING, BLOCKING PRODUCT
adminRoute.get("/productList", adminController.productList);
adminRoute.post('/block-product', productController.blockProduct);

//ADD PRODUCT PAGE RENDERING, ADDING PRODUCT, REMOVING PRODUCT THAT DONT HAVE A VARIANT, CHECKING CATEGORY
adminRoute.get("/addProduct" , adminController.addProduct);
adminRoute.post("/adding-product", productController.addingProduct);
adminRoute.get("/edit-this-product", productController.editThisProduct);
adminRoute.patch("/update-product", productController.updateProduct);
adminRoute.delete("/delete-product", productController.deleteProduct);
adminRoute.get("/remove-product", productController.removeProductVariantFalse);
adminRoute.get("/check-category", categoryController.checkCategory);


adminRoute.get("/orders", adminController.orders);
adminRoute.get("/order-detail", adminController.orderDetail)

//USERS LIST PAGE RENDERING, BLOCKING AND UNBLOCKING USER
adminRoute.get("/users", adminController.allUsers);
adminRoute.put("/blockUser", adminController.userControl);

adminRoute.get("/userDetails", adminController.userDetails);


adminRoute.get("/categories", adminController.categories);
adminRoute.post("/addCategory", categoryController.addCategory);
adminRoute.get("/edit-category-get", categoryController.getCatEdit)
adminRoute.post("/update-category", upload.none(), categoryController.updateCategory)
adminRoute.get("/delete-category", categoryController.deleteCategory);


//ADD VARIANT
adminRoute.post('/add-variant', upload.any(),variantController.addVriant);

//VARIANT PAGE LOAD
adminRoute.get("/load-variant", variantController.loadVariant);

//EDIT VARIANT
adminRoute.get("/edit-variant", variantController.editVariant);
adminRoute.post("/update-variant", upload.any(), variantController.updateVariant);
// adminRoute.patch("/admin/block-variant")


module.exports = adminRoute;
