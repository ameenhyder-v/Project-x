const User = require("../Model/userModel")
const otpContoller = require("../Controller/otpController")
const otpModel = require('../Model/otpModel')
const Variant = require("../Model/variantModel")
const bcrypt = require("bcrypt");




const register = async (req, res) => {
    try {
        const messageEmail = req.flash("messageEmail");
        const messageUsername = req.flash("messageUsername");
        const messagePassword = req.flash("messagePassword")
        const messagePasswordConfirm = req.flash("messagePasswordConfirm")

        res.render('register', { messageEmail, messageUsername, messagePassword, messagePasswordConfirm })
    }
    catch (error) {
        console.log(`error from register: ${error}`);
    }
}

const insertUser = async (req, res) => {
    try {
        const { username, email, password, psconfirm } = req.body;

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (username.length < 4) {
            req.flash("messageUsername", "Username must be at least 4 characters long.")
            return res.redirect("/registration");
        }

        if (!emailRegex.test(email)) {
            req.flash("messageEmail", "Invalid email format.")
            return res.redirect("/registration");
        }

        if (!passwordRegex.test(password)) {
            req.flash("messagePassword", "Password must be at least 8 characters long and include at least one uppercase letter and one number.")
            return res.redirect("/registration");
        }

        if (password !== psconfirm) {
            req.flash("messagePasswordConfirm", "Passwords do not match.")
            return res.redirect("/registration");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            req.flash("messageEmail", "Email is already in use!")
            return res.redirect("/registration");
        
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const userData = new User({
            name: username,
            email: email,
            password: hashedPassword,
        });

        req.session.email = email;
        req.session.userData = userData;

        const otpp = otpContoller.sendMail(email);
        const otp = parseInt(otpp);
        console.log(otp);
        console.log(otpp);

        const save = new otpModel({
            emailId: email,
            otp: otp,
        });

        await save.save();
        res.render("otp", { email: email });

        // console.log(req.session);
    } catch (error) {

        console.log(`Error from the userRegister: ${error}`);
    }
};

const successGoogleLogin = async (req, res) => {
    try {
        if (!req.user){
            res.redirect("/failure")
        }else {
            const { displayName, email,} = req.user;

            const userData = new User({
                name: displayName,
                email: email
            });
            const isExists = await User.findOne({email: email})
            console.log(isExists)
            if (isExists) {
                req.session.userId = isExists._id
                // console.log(req.session.userId)
                return res.redirect("/")
            }


            const saving = await userData.save()
            if (saving){
                req.session.userId = saving._id
                console.log(req.session.userId)
                // console.log("success");
                
                return res.redirect("/")
            }

            // console.log(`name ${displayName},     email ${email}`)

        }
        
    } catch (error) {
        
    }
}

const failureGoolgeLogin = async (req, res) => {
    req.flash("message", "Login using google has been Faild!")
    res.redirect("/login")
}

const otpVerify = async (req, res) => {
    // console.log(req.body);
    // console.log(req.session);
    try {

        console.log('req,body: ',req.body);


        const OTP = req.body.otp
        console.log('otp oppp',OTP)

        const findOtp = await otpModel.findOne({ emailId: req.session.email });

        // console.log(OTP === findOtp.otp)

        if (OTP !== findOtp.otp) {
            res.send({ status: 0 })
        } else {

            const userData = req.session.userData;
            await User.create(userData);

            res.send({ status: 1 })
        }

    } catch (error) {
        console.log(`error form the userController.otpVarify: ${error}`)
    }

}


const userLogin = async (req, res) => {
    try {
        const message = req.flash("message")
        const messagePassword = req.flash("messagePassword")
        res.render("login", { message, messagePassword })
    } catch (error) {
        console.log(`error from userLogin: ${error}`);
    }
}

const userVarify = async (req, res) => {
    try {
        const { username, password } = req.body;
        const Data = await User.findOne({ $or: [{ name: username }, { email: username }] })
        if (!Data) {
            req.flash( "message", "User Name or Email incorect" )
            res.redirect("/login")

        } else {
            const comparePsw = await bcrypt.compare(password, Data.password);
            if (!comparePsw) {
                req.flash("messagePassword", "Incorrect Password")
                res.render("login")
            }else {
                req.session.userId = Data._id;
                res.render("home");
            }
        }
    } catch (error) {
        console.log(`error from userConroller.userVarify: ${error}`);
    }
}

const home = async (req, res) => {
    try {
        const variants = await Variant.find().populate("productId")
        // console.log(variants);
        res.render('home', { variants: variants});
    } catch (error) {
        console.log(`error from home: ${error}`);
    }
}
const productDetails = async (req, res) => {
    try {
        const { variantId } = req.query;
        const variant = await Variant.findOne({ _id: variantId }).populate("productId");
        const variants = await Variant.find({productId:variant.productId})
        res.render("productDetail", {variant: variant,variants:variants});
    } catch (error) {
        console.log(`error from productDetails: ${error}`);
    }
}

const allProducts = async (req, res) => {
    try {
        res.render("allProducts")
    } catch (error) {
        console.log(`error from allProducts: ${error}`)
    }
}



const shopingCart = async (req, res) => {
    try {
        res.render("shoping-cart")
    } catch (error) {
        console.log(`error from shoping cart: ${error}`)
    }
}





module.exports = {
    register,
    home,
    productDetails,
    userLogin,
    allProducts,
    shopingCart,
    insertUser,
    otpVerify,
    userVarify,
    successGoogleLogin,
    failureGoolgeLogin
};