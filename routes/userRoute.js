const express = require("express")
const userRoute = express();
const userController = require("../Controller/userController")
const otpContoller = require("../Controller/otpController");
const checkState = require("../middleware/userAuth")
const passport = require("passport");
const cartContoller = require("../Controller/cartController");
const upload = require("../middleware/multer");
const accountController = require("../Controller/accountController")
const checkoutController = require("../Controller/checkoutController")
const productController = require("../Controller/productController")
require("../passport")


userRoute.use(passport.initialize());
userRoute.use(passport.session())
userRoute.set("view engine", "ejs");

userRoute.set("views", "./views/users")

userRoute.get("/", userController.home)

//FOR USER REGISTRATION
userRoute.get("/registration", checkState.isLogout,userController.register);
userRoute.post("/registration", userController.insertUser);
userRoute.post("/otpVerify", userController.otpVerify);
userRoute.get("/resend-otp", checkState.isLogout, otpContoller.resendOtp)


//FOR USER LOGIN
userRoute.get("/login", userController.userLogin);
userRoute.post("/login", userController.userVarify);

//for passport google authentication
userRoute.get("/auth/google", checkState.isLogout, passport.authenticate("google", {scope: ["email", "profile"]}));
userRoute.get("/auth/google/callback", checkState.isLogout, passport.authenticate("google", {successRedirect: "/success", failureRedirect: "/failure"}))
userRoute.get("/success", checkState.isLogout, userController.successGoogleLogin),
userRoute.get("/failure", userController.failureGoolgeLogin)

//FORGOT PASSWORD
userRoute.get("/forget-password",  userController.forgetPass);
userRoute.post("/forget-password",  otpContoller.forgetPassOtp);
userRoute.post("/forgetOtpVerify", otpContoller.otpVerify);
userRoute.get("/for-resend-otp", checkState.isLogout, otpContoller.forgetResendOtp);
userRoute.get("/change-password",  userController.changePassword);
userRoute.post("/change-password",  userController.updatePassword);

//! VIEW ALL PRODUCT
userRoute.get("/allProducts", checkState.isLogin, userController.allProducts);

//! ADD TO CART
userRoute.post("/addToCart", checkState.isLogin, cartContoller.addToCart);


userRoute.get("/productDetail", checkState.isLogin, userController.productDetails);

//! SHOPING CART
userRoute.get("/shoping-cart", checkState.isLogin, cartContoller.shopingCart);
userRoute.patch("/add-quantity", upload.none(),cartContoller.addQuantity)
userRoute.patch("/delete-quantity", upload.none(), cartContoller.decreaseQuantity)



//! TO GET UUSER ACCOUNT SECTION
userRoute.get("/my-account",checkState.isLogin, accountController.accountLoad);

userRoute.post("/edit-user", checkState.isLogin, accountController.updateUserProfile);
userRoute.post("/change-user-password", checkState.isLogin, accountController.changePassword)
userRoute.post("/add-password", checkState.isLogin, accountController.addPassword)

userRoute.get("/add-address",checkState.isLogin, accountController.addAddress);
userRoute.post("/add-address",checkState.isLogin, accountController.addingAddress);

userRoute.get("/my-orders", checkState.isLogin, accountController.allOrders)
userRoute.get("/order-summary", checkState.isLogin, accountController.orderSummary)


//! USER CHECK-OUT SECTION
userRoute.post("/adding-address", checkState.isLogin, accountController.addAddressFromCheckout);
userRoute.get("/checkout", checkState.isLogin, checkoutController.checkOut);
userRoute.post("/place-order", checkState.isLogin, checkoutController.placeOrder);

//! SORTING AND FILTERING 
userRoute.patch("/sort", checkState.isLogin, productController.sort);
userRoute.patch("/alphaSort", checkState.isLogin, productController.AlphaSort);



module.exports = userRoute