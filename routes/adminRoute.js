const express = require("express");
const adminRoute = express();
const adminController = require("../Controller/adminController");
const categoryController = require("../Controller/categoryController");
const productController = require("../Controller/productController")
const variantController = require('../Controller/variantController');
const upload = require('../middleware/multer');
const couponController = require("../Controller/coupon-controller");
const adminAuth = require("../middleware/adminAuth")
// const multer = require("multer");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin")

adminRoute.get("/", adminAuth.isLogout, adminController.adminLogin);
adminRoute.post("/", adminAuth.isLogout, adminController.verifyAdmin);


adminRoute.get("/dashboard", adminAuth.isLogin, adminController.dashboard);


//PRODUCTLIST PAGE RENDERING, BLOCKING PRODUCT
adminRoute.get("/productList", adminAuth.isLogin, adminController.productList);
adminRoute.post('/block-product', adminAuth.isLogin, productController.blockProduct);

//ADD PRODUCT PAGE RENDERING, ADDING PRODUCT, REMOVING PRODUCT THAT DONT HAVE A VARIANT, CHECKING CATEGORY
adminRoute.get("/addProduct", adminAuth.isLogin, adminController.addProduct);
adminRoute.post("/adding-product", adminAuth.isLogin, productController.addingProduct);
adminRoute.get("/edit-this-product", adminAuth.isLogin, productController.editThisProduct);
adminRoute.patch("/update-product", adminAuth.isLogin, productController.updateProduct);
adminRoute.delete("/delete-product", adminAuth.isLogin, productController.deleteProduct);
adminRoute.get("/remove-product", adminAuth.isLogin, productController.removeProductVariantFalse);
adminRoute.get("/check-category", adminAuth.isLogin, categoryController.checkCategory);


//! ORDER SECTION 
adminRoute.get("/orders", adminAuth.isLogin, adminController.orders);
adminRoute.get("/order-detail", adminAuth.isLogin, adminController.orderDetail);
adminRoute.patch("/orders/updateStatus", adminAuth.isLogin, adminController.updateOrderStatus);
adminRoute.patch("/orders/return-reject", adminAuth.isLogin, adminController.rejectReturn);
adminRoute.patch("/orders/return-accept", adminAuth.isLogin, adminController.acceptReturn)

//USERS LIST PAGE RENDERING, BLOCKING AND UNBLOCKING USER
adminRoute.get("/users", adminAuth.isLogin, adminController.allUsers);
adminRoute.put("/blockUser", adminAuth.isLogin, adminController.userControl);

adminRoute.get("/userDetails", adminAuth.isLogin, adminController.userDetails);


adminRoute.get("/categories", adminAuth.isLogin, adminController.categories);
adminRoute.post("/addCategory", adminAuth.isLogin, categoryController.addCategory);
adminRoute.get("/edit-category-get", adminAuth.isLogin, categoryController.getCatEdit)
adminRoute.post("/update-category", upload.none(), categoryController.updateCategory)
adminRoute.get("/delete-category", adminAuth.isLogin, categoryController.deleteCategory);


//!ADD VARIANT
adminRoute.get("/add-new-variant", adminAuth.isLogin, variantController.loadAddNewVariant)
adminRoute.post("/add-new-variant", upload.any(), variantController.addNewVariant)

adminRoute.post('/add-variant', upload.any(),variantController.addVariant);

//!VARIANT PAGE LOAD
adminRoute.get("/load-variant", adminAuth.isLogin, variantController.loadAllVariant);
//!DELETE VARIANT
adminRoute.delete("/load-variant/deleteVarint", adminAuth.isLogin, variantController.deleteVariant);

//!EDIT VARIANT
adminRoute.get("/edit-variant", adminAuth.isLogin, variantController.editVariant);
adminRoute.post("/update-variant", upload.any(), variantController.updateVariant);
// adminRoute.patch("/admin/block-variant")


//!COUPON SECTION 
adminRoute.get("/coupon", adminAuth.isLogin, couponController.coupon);
adminRoute.post("/coupon/add",  upload.none(), couponController.addCoupon);
adminRoute.delete("/coupon/delete", adminAuth.isLogin, couponController.deleteCoupon);
adminRoute.get("/coupon/getCoupon", adminAuth.isLogin, couponController.getCouponForEdit);
adminRoute.post("/coupon/update", adminAuth.isLogin, couponController.updateCoupon);


module.exports = adminRoute;
