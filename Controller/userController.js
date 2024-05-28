const User = require("../Model/userModel")
const otpContoller = require("../Controller/otpController")
const otpModel = require('../Model/otpModel')
const bcrypt = require("bcrypt");
const { log } = require("console");




const register = async (req, res) => {
    try {
        res.render('register')
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
            return res.render("register", { messageUsername: "Username must be at least 4 characters long.", });
        }

        if (!emailRegex.test(email)) {
            return res.render("register", { messageEmail: "Invalid email format." });
        }

        if (!passwordRegex.test(password)) {
            return res.render("register", { messagePassword: "Password must be at least 8 characters long and include at least one uppercase letter and one number." });
        }

        if (password !== psconfirm) {
            return res.render("register", { messagePasswordConfirm: "Passwords do not match." });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.render("register", { messageEmail: "Email is already in use!" });
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

        console.log(req.session);
    } catch (error) {
        console.log(`Error from the userRegister: ${error}`);
        res.render("register", {
            messageError: "An error occurred during registration. Please try again.",
        });
    }
};



const otpVerify = async (req, res) => {
    // console.log(req.body);
    // console.log(req.session);
    try {
        console.log(req.body);
        const OTP = req.body.otp

        const findOtp = await otpModel.findOne({ emailId: req.session.email });

        // console.log(OTP === findOtp.otp)

        if (OTP !== findOtp.otp) {
            res.send({ status: 0 })
        } else {

            const userData = req.session.userData;
            userData.is_Verified = true;
            await User.create(userData);

            res.send({ status: 1 })
        }

    } catch (error) {
        console.log(`error form the userController.otpVarify: ${error}`)
    }

}

const home = async (req, res) => {
    try {
        res.render('home')
    } catch (error) {
        console.log(`error from home: ${error}`);
    }
}
const productDetails = async (req, res) => {
    try {
        res.render("productDetail")
    } catch (error) {
        console.log(`error from productDetails: ${error}`);
    }
}


const userLogin = async (req, res) => {
    try {
        res.render("login")
    } catch (error) {
        console.log(`error from userLogin: ${error}`);
    }
}

const userVarify = async (req, res) => {
    try {
        const { username, password } = req.body;
        const Data = await User.findOne({ $or: [{ name: username }, { email: username }] })
        if (!Data) {

            res.render("login", {message: "User Name or Email incorect"})

        } else {
            const comparePsw = await bcrypt.compare(password, Data.password);
            if (!comparePsw) {
                res.render("login", {messagePassword: "Incorrect Password"})
            }else {
                req.session.UserId = Data._id;
                res.render("home");
            }
        }
    } catch (error) {
        console.log(`error from userConroller.userVarify: ${error}`);
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
};