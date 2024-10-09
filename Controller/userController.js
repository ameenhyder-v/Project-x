const User = require("../Model/userModel")
const otpContoller = require("../Controller/otpController")
const otpModel = require('../Model/otpModel')
const Variant = require("../Model/variantModel")
const bcrypt = require("bcrypt");
const wishlistController = require("../Controller/wishlist-controller");
const categoryController = require("./categoryController");
const Product = require("../Model/productModel");




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



//FINDING USERE IS ALREADY EXISTS USING EMAIL
const userExists = async function (email) {
    return await User.findOne({ email: email });
}


//CREATING USER
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

        const existingUser = await userExists(email)

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

        const otpp = await otpContoller.sendMail(email);
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

//GOOGLE AUTHENTICATION
const successGoogleLogin = async (req, res) => {
    try {
        if (!req.user) {
            res.redirect("/failure")
        } else {
            const { displayName, email, } = req.user;

            const userData = new User({
                name: displayName,
                email: email
            });
            const isExists = await userExists(email);
            // console.log(isExists)
            if (isExists) {
                req.session.userId = isExists._id
                console.log(req.session.userId)
                return res.redirect("/")
            }


            const saving = await userData.save()
            if (saving) {
                req.session.userId = saving._id
                console.log(req.session.userId)
                return res.redirect("/")
            }
        }

    } catch (error) {

    }
}

const failureGoolgeLogin = async (req, res) => {
    req.flash("message", "Login using google has been Faild!")
    res.redirect("/login")
}


//OTP VARIFICATION WHEN CREATING ACCOUNT
const otpVerify = async (req, res) => {
    try {

        const OTP = req.body.otp
        console.log('otp oppp', OTP)

        const findOtp = await otpModel.findOne({ emailId: req.session.email });
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
        const success = req.flash("success");
        res.render("login", { message, messagePassword, success })
    } catch (error) {
        console.log(`error from userLogin:--------------- ${error}`);
    }
}

const userVarify = async (req, res) => {
    try {
        const { username, password } = req.body;
        const Data = await User.findOne({ $or: [{ name: username }, { email: username }] })
        if(Data.isBlocked == true){
            req.flash("message", "You are currently blocked by the admin")
            res.redirect("/login")
        }
        if (!Data) {
            req.flash("message", "User Name or Email incorect")
            res.redirect("/login")

        } else {
            const comparePsw = await bcrypt.compare(password, Data.password);
            if (!comparePsw) {
                req.flash("messagePassword", "Incorrect Password")
                res.redirect("/login")
            } else {
                req.session.userId = Data._id;
                res.redirect("/");
            }
        }
    } catch (error) {
        console.log(`error from userConroller.userVarify: ${error}`);
    }
}



//! HOME PAGE LOAD
const home = async (req, res) => {
    try {
        const allVariants = await Variant.find()
            .populate({
                path: 'productId',
                populate: {
                    path: 'categoryId',
                    model: 'Category'
                }
            });

        const filteredVariants = allVariants.filter(variant => {
            const product = variant.productId;
            const category = product && product.categoryId;
            return product && !product.isBlocked && category && !category.isBlocked;
        });

        const shuffledVariants = filteredVariants.sort(() => 0.5 - Math.random()).slice(0, 8);

        res.render('home', { variants: shuffledVariants });
    } catch (error) {
        console.log(`Error from home: ${error}`);
        res.status(500).send("An error occurred while loading the home page.");
    }
};




//! PRODUCT DETAILS PAGE LOAD
const productDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { variantId } = req.query;
        const variant = await Variant.findOne({ _id: variantId }).populate("productId");
        const variants = await Variant.find({ productId: variant.productId })
        const wishListData = await wishlistController.findUsersWishlistItems(userId);
        
        res.render("productDetail", { variant, variants, wishList: wishListData });
    } catch (error) {
        console.log(`error from productDetails: ${error}`);
    }
}

//! LOAD ALL PRODUCTS SHOPE PAGE 
const allProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const skip = (page - 1) * limit;

        const allVariants = await Variant.find()
            .populate({
                path: 'productId',
                populate: {
                    path: 'categoryId',
                    model: 'Category'
                }
            })
            .skip(skip) 
            .limit(limit); 

        const variants = allVariants.filter(variant => {
            const product = variant.productId;
            const category = product && product.categoryId;
            return product && !product.isBlocked && category && !category.isBlocked;
        });

        const totalVariants = await Variant.countDocuments();
        const allCategories = await categoryController.getAllCategory();
        const totalPages = Math.ceil(totalVariants / limit);
        // console.log(`Total Pages: ${totalPages}, Current Page: ${page}`);


        res.render("allProducts", {
            variants,
            allCategories,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.log(`error from allProducts: ${error}`);
    }
};


//! ALL WOMEN PRODUCTS 
const womenAllProducts = async (req, res) => {
    try {
        const allVariants = await Variant.find()
            .populate({
                path: 'productId',
                populate: {
                    path: 'categoryId',
                    model: 'Category'
                }
            })
            .exec();


        
        const filteredVariants = allVariants.filter(variant => {
            return (
                !variant.productId.isBlocked &&
                !variant.productId.categoryId.isBlocked && 
                variant.productId.categoryId.gender === 'Female'
            );
        });
        const allCategoriesInDb = await categoryController.getAllCategory()
        const allCategories = allCategoriesInDb.filter((category) =>{
                                    return category.gender === "Female"
                                });

        
        res.render("women-all-products", { variants: filteredVariants, allCategories });

    } catch (error) {
        console.log(`Error from the user controller womenAllProducts: ${error}`);
    }
};


//! ALL MEN PRODUCTS 
const menAllProducts = async (req, res) => {
    try {

        const allVariants = await Variant.find()
            .populate({
                path: 'productId',
                populate: {
                    path: 'categoryId', 
                    model: 'Category'
                }
            })
            .exec();

        const filteredVariants = allVariants.filter(variant => {
            return (
                !variant.productId.isBlocked &&
                !variant.productId.categoryId.isBlocked && 
                variant.productId.categoryId.gender === 'Male'
            );
        });


        const allCategoriesInDb = await categoryController.getAllCategory()
        const allCategories = allCategoriesInDb.filter((category) => {
            return category.gender === "Male"
        })
        // Render the results with the filtered variants
        res.render("men-all-products", { variants: filteredVariants, allCategories });
    } catch (error) {
        console.log(`error from the user controller menAllProducts : ${error}`)
    }
}



//FORGOT PASSWORD PAGE RENDERING
const forgetPass = async (req, res) => {
    try {

        const message = req.flash("message")

        res.render("forgetPass", { message })

    } catch (error) {
        console.log(`error form the getting userController.forgotPass: ${error}`)
    }
}


//CHANGE PASSWORD PAGE LOAD
const changePassword = async (req, res) => {
    try {

        const email = req.session.email
        const messagePassword = req.flash("messagePassword")
        const messagePasswordConfirm = req.flash("messagePasswordConfirm")
        const message = req.flash("message");
        res.render("changePassword", { email, messagePassword, messagePasswordConfirm, message })


    } catch (error) {
        console.log(`error from the user controller. changePassword loading: ${error}`)
    }
}

//UPDATING PASSWORD
const updatePassword = async (req, res) => {
    try {

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const { password, psconfirm } = req.body;
        const email = req.session.email;
        console.log(`password:${password}      ---------     psConfirm: ${psconfirm}, email : ${email}`)
        if (!email) {
            req.flash("message", "try again.....");
            res.redirect("/forget-password")
        }

        if (!passwordRegex.test(password)) {
            req.flash("messagePassword", "Password must be at least 8 characters long and include at least one uppercase letter and one number.")
            return res.redirect("/change-password");
        }

        if (password !== psconfirm) {
            req.flash("messagePasswordConfirm", "Passwords do not match.")
            return res.redirect("/change-password");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOneAndUpdate({ email: email }, { $set: { password: hashedPassword } })
        if (user) {
            req.flash("success", "Password Changed");
            res.redirect("/login")
        } else {
            req.flash("message", "try again.....");
            res.redirect("/forget-password")
        }
    } catch (error) {
        console.log(`error form the userController . updatePassword${error}`)
    }
}

const sortFilterSearch = async (req, res) => {
    try {
        const { sort, filter, search } = req.query;

        let query = {};

        // Add search functionality
        if (search) {
            query['productId'] = {
                $in: await Product.find({
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { brand: { $regex: search, $options: 'i' } },
                        { material: { $regex: search, $options: 'i' } },
                        { tags: { $regex: search, $options: 'i' } } 
                    ]
                }).distinct('_id') 
            };
        }

        const variants = await Variant.find(query)
            .populate({
                path: 'productId',
                populate: {
                    path: 'categoryId',
                    select: 'gender category'
                }
            })
            .exec();

        // Filter based on category and gender
        let filteredVariants = variants;
        if (filter && filter === 'Women *') {
            filteredVariants = variants.filter(variant => {
                const product = variant.productId;
                return product.categoryId && product.categoryId.gender === 'Female';
            });
        } else if (filter && filter === 'Men *') {
            filteredVariants = variants.filter(variant => {
                const product = variant.productId;
                return product.categoryId && product.categoryId.gender === 'Male';
            });
        } else if (filter && filter !== '*') {
            const [category, gender] = filter.split(' ');

            filteredVariants = variants.filter(variant => {
                const product = variant.productId;
                return product.categoryId && product.categoryId.category === category && product.categoryId.gender === gender;
            });
        }

        // Sorting
        if (sort === 'nameAZ') {
            filteredVariants.sort((a, b) => a.productId.name.localeCompare(b.productId.name));
        } else if (sort === 'nameZA') {
            filteredVariants.sort((a, b) => b.productId.name.localeCompare(a.productId.name));
        } else if (sort === 'lowToHigh') {
            filteredVariants.sort((a, b) => {
                const aEffectivePrice = Math.min(
                    a.productOfferPrice || a.price,
                    a.categoryOfferPrice || a.price
                );
                const bEffectivePrice = Math.min(
                    b.productOfferPrice || b.price,
                    b.categoryOfferPrice || b.price
                );
                return aEffectivePrice - bEffectivePrice;
            });
        } else if (sort === 'highToLow') {
            filteredVariants.sort((a, b) => {
                const aEffectivePrice = Math.min(
                    a.productOfferPrice || a.price,
                    a.categoryOfferPrice || a.price
                );
                const bEffectivePrice = Math.min(
                    b.productOfferPrice || b.price,
                    b.categoryOfferPrice || b.price
                );
                return bEffectivePrice - aEffectivePrice;
            });
        }

        res.json({ variants: filteredVariants });

    } catch (error) {
        console.log(`Error in the sort filter search section: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    register,
    home,
    productDetails,
    userLogin,
    allProducts,
    insertUser,
    otpVerify,
    userVarify,
    successGoogleLogin,
    failureGoolgeLogin,
    forgetPass,
    userExists,
    updatePassword,
    changePassword,
    womenAllProducts,
    menAllProducts,
    sortFilterSearch
};