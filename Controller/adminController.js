const Users = require("../Model/userModel");
const CategoryModel = require("../Model/categoryModel");
const Product = require("../Model/productModel");
const Order = require("../Model/orderModel");


const adminLogin = async (req, res) => {
    try {
        const message = req.flash("error")
        res.render("admin_login", { message })
    } catch (error) {
        console.log(`errof form the admin Login : ${error}`)
    }
}


const verifyAdmin = async (req, res) => {
    const { username, password } = req.body;

    // validation of email and password regex form
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(username)) {
        req.flash("error", "Invalid email format.")
        return res.redirect("/admin/login");
    }

    if (username === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
        const adminPass = "&admin@3312"

        req.session.admin = adminPass
        return res.render("dashboard");
    } else {
        if (username !== process.env.ADMIN_EMAIL){
            req.flash("error", "Invalid Email.")
            return res.redirect("/admin/login");
        }
        
        req.flash("error", "Password not match.")
        return res.redirect("/admin/login");
    }
}

const dashboard = async (req, res) => {
    try {

        res.render("dashboard");
    } catch (error) {
        console.log(`error from dashboaer: ${error}`);
    }
};




const productList = async (req, res) => {
    try {

        const limit = 10; 
        const page = parseInt(req.query.page) || 1; 
        const allProducts = await Product.find().sort({ _id: -1 });
        const falseCategories = await CategoryModel.find({ isBlocked: false });
        const falseCategoryName = falseCategories.map(categories => categories.name);
        const filteredProducts = allProducts.filter(product => !falseCategoryName.includes(product.category));

        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const productsToShow = filteredProducts.slice(startIndex, endIndex);


        res.render("productList", { allProducts: productsToShow, currentPage: page, totalPages: totalPages });
    } catch (error) {
        console.log(`error form productList loding: ${error}`)
    }
}

const addProduct = async (req, res) => {
    try {
        res.render("addProducts");
    } catch (error) {
        console.log(`error from the admincontroler addProduct ${error}`)
    }
}

const orders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of orders per page
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        const orderData = await Order.find()
            .populate("userId")
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        res.render("orders", {
            orderData,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.log(`error from the admin controller.orders: ${error}`);
    }
}

const orderDetail = async (req, res) => {
    try {
        const { orderId } = req.query;
        // console.log(orderId);
        const order = await Order.findById(orderId).populate({
                path: 'userId',
            })
            .populate({
                path: 'orderedItems.variantId',
            })

            orderItems = order.orderedItems;
            userData = order.userId;
            console.log(userData)
        
        //todo for getting first product image - ( order.orderedItems[0].variantId.image[0] )

        res.render("orderDetails", { order, orderItems, userData })

    } catch (error) {
        console.log(`error from the admin controller orderDetail ${error}`)
    }
}

const allUsers = async (req, res) => {
    try {
        const allUsers = await Users.find();
        // console.log(allUsers)
        res.render("users", { users: allUsers })
    } catch (error) {
        console.log(`error from the adminController.allUsers: ${error}`)
    }
}

const userControl = async (req, res) => {
    try {
        console.log("working")
        const { id, state } = req.query
        console.log(`id= ${id} stste = ${state}`)
        const data = await Users.findById({ _id: id })
        data.isBlocked = !data.isBlocked
        const isSave = await data.save()

        console.log(isSave)
        console.log(data);
        if (data) {
            res.send({ success: 1 })
        }
    } catch (error) {
        console.log(`error form adminControler.userControl: ${error}`);
    }
}

const userDetails = async (req, res) => {
    try {
        res.render("userDetails");
    } catch (error) {
        console.log(`error from the adminController.userDetails: ${error}`)
    }
}


const categories = async (req, res) => {
    try {
        const perPage = 10; // Number of categories per page
        const page = parseInt(req.query.page) || 1; // Current page, default to 1 if not provided
        const message = req.flash("message")

        const totalCategories = await CategoryModel.countDocuments(); // Total number of categories
        const totalPages = Math.ceil(totalCategories / perPage); // Calculate total pages

        const categoryData = await CategoryModel.find()
            .sort({ _id: -1 })
            .skip((page - 1) * perPage) 
            .limit(perPage);

        res.render("categories", { Data: categoryData, currentPage: page, totalPages, message });
    } catch (error) {
        console.log(`error form the adminControler.categories ${error}`)
    }
}

module.exports = {
    verifyAdmin,
    dashboard,
    productList,
    orders,
    adminLogin,
    addProduct,
    allUsers,
    userDetails,
    categories,
    userControl,
    orderDetail
};