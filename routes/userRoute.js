const express = require("express");
const userRoute = express();
const userController = require("../Controller/userController")
const otpContoller = require("../Controller/otpController");
const checkState = require("../middleware/userAuth");
const passport = require("passport");
const cartContoller = require("../Controller/cartController");
const upload = require("../middleware/multer");
const accountController = require("../Controller/accountController");
const checkoutController = require("../Controller/checkoutController");
const wishlistController = require("../Controller/wishlist-controller");
const OrderController = require("../Controller/orderController");
const couponController = require("../Controller/coupon-controller");
const invoiceController = require("../Controller/invoiceController");


require("../passport")


userRoute.use(passport.initialize());
userRoute.use(passport.session())
userRoute.use(checkState.addUserToLocals)

userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.home)


//! FOR USER REGISTRATION
userRoute.get("/registration", checkState.isLogout,userController.register);
userRoute.post("/registration", userController.insertUser);
userRoute.post("/otpVerify", userController.otpVerify);
userRoute.get("/resend-otp", checkState.isLogout, otpContoller.resendOtp)


//! FOR USER LOGIN
userRoute.get("/login",checkState.isLogout, userController.userLogin);
userRoute.post("/login",  userController.userVarify);


//! for passport google authentication
userRoute.get("/auth/google", checkState.isLogout, passport.authenticate("google", {scope: ["email", "profile"]}));
userRoute.get("/auth/google/callback", checkState.isLogout, passport.authenticate("google", {successRedirect: "/success", failureRedirect: "/failure"}))
userRoute.get("/success", checkState.isLogout, userController.successGoogleLogin),
userRoute.get("/failure", userController.failureGoolgeLogin)

//! FORGOT PASSWORD
userRoute.get("/forget-password",  userController.forgetPass);
userRoute.post("/forget-password",  otpContoller.forgetPassOtp);
userRoute.post("/forgetOtpVerify", otpContoller.otpVerify);
userRoute.get("/for-resend-otp", checkState.isLogout, otpContoller.forgetResendOtp);
userRoute.get("/change-password",  userController.changePassword);
userRoute.post("/change-password",  userController.updatePassword);

//! VIEW ALL PRODUCT
userRoute.get("/allProducts", checkState.isLogin, userController.allProducts);
userRoute.get("/women-products", checkState.isLogin, userController.womenAllProducts)
userRoute.get("/men-products", checkState.isLogin, userController.menAllProducts);

//! SORTING AND FILTERING 
userRoute.get('/products', userController.sortFilterSearch);


//! ADD TO CART
userRoute.post("/addToCart", checkState.isLogin, cartContoller.addToCart);


userRoute.get("/productDetail", checkState.isLogin, userController.productDetails);

//! SHOPING CART
userRoute.get("/shoping-cart", checkState.isLogin, cartContoller.shopingCart);
userRoute.patch("/add-quantity", upload.none(),cartContoller.addQuantity);
userRoute.patch("/delete-quantity", upload.none(), cartContoller.decreaseQuantity);
userRoute.patch("/remove-item", checkState.isLogin, cartContoller.removeItem);



//! TO GET UUSER ACCOUNT SECTION
userRoute.get("/my-account",checkState.isLogin, accountController.accountLoad);

userRoute.post("/edit-user", checkState.isLogin, accountController.updateUserProfile);
userRoute.post("/change-user-password", checkState.isLogin, accountController.changePassword)
userRoute.post("/add-password", checkState.isLogin, accountController.addPassword)

userRoute.get("/add-address",checkState.isLogin, accountController.addAddress);
userRoute.post("/add-address",checkState.isLogin, accountController.addingAddress);
userRoute.get("/get-address", checkState.isLogin, accountController.getAddressForEdit);
userRoute.post("/update-address", checkState.isLogin, accountController.updateAddress);
userRoute.delete("/delete-address", checkState.isLogin, accountController.deleteAddress);
userRoute.get("/logout", checkState.isLogin, accountController.logout);

//! HANDLING ORDER SECTION 
userRoute.get("/my-orders", checkState.isLogin, accountController.allOrders);
userRoute.get("/order-summary", checkState.isLogin, accountController.orderSummary);
userRoute.post("/returnOrder", checkState.isLogin, OrderController.returnOrder);
userRoute.post("/cancelOrder", checkState.isLogin, OrderController.cancelOrder);
userRoute.post("/retry-payment", checkState.isLogin, checkoutController.retryPayment );
userRoute.get('/order/invoice/download', checkState.isLogin, invoiceController.generateInvoice);




//! USER CHECK-OUT SECTION
userRoute.post("/adding-address", checkState.isLogin, accountController.addAddressFromCheckout);
userRoute.get("/checkout", checkState.isLogin, checkoutController.checkOut);
userRoute.post("/place-order", checkState.isLogin, checkoutController.placeOrder);
userRoute.post("/confirm-payment", checkoutController.confirmPayment);


//! USER'S WISH-LIST
userRoute.get("/wishlist", wishlistController.loadWishlist);
userRoute.post("/wishlist/add", checkState.isLogin, wishlistController.addToWishlist);
userRoute.post("/wishlist/remove", checkState.isLogin, wishlistController.removeWishItem);

//! COUPON SECTION
userRoute.get("/coupons/all", checkState.isLogin, couponController.getAllAvailCoupons);
userRoute.post("/coupon/apply", checkState.isLogin, checkoutController.applyCoupon);
userRoute.post("/coupon/remove", checkState.isLogin, checkoutController.removeCoupon);




module.exports = userRoute