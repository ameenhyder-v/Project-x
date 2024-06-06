const Users = require("../Model/userModel");
const CategoryModel = require("../Model/categoryModel");
const Product = require("../Model/productModel");


const adminLogin = async (req, res) => {
    try {
        res.render("admin_login")
    } catch (error) {
        console.log(`errof form the admin Login : ${error}`)
    }
}


const verifyAdmin = async (req, res) => {
  const { username, password } = req.body;

  // validation of email and password regex form
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!emailRegex.test(username)) {
    return res.render("admin_login",{ message: "Invalid email format." });
  }b

  if (username === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    return res.render("dashboard");
  } else {
    return res.render("admin_login",{ message: "Invalid username or password." });
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
        const allProducts = await Product.find();
        res.render("productList", {allProducts: allProducts});
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

        res.render("orders")
    } catch (error) {
        console.log(`error from the admin controller.orders: ${error}`)
    }
}


const allUsers = async (req, res) => {
    try {
        const allUsers = await Users.find();
        // console.log(allUsers)
        res.render("users", {users: allUsers})
    } catch (error) {
        console.log(`error from the adminController.allUsers: ${error}`)
    }
}

const userControl = async (req, res) => {
    try {
        console.log("working")
        const {id, state} = req.query
        console.log(`id= ${id} stste = ${state}`)
        const data = await Users.findById({_id: id})
        data.isBlocked = !data.isBlocked
        const isSave = await data.save()

        console.log(isSave)
        console.log(data);
        if (data){
            res.send({success: 1})
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
        const categoryData = await CategoryModel.find()

        res.render("categories", {Data: categoryData });
    } catch (error) {
        console.log(`error form the adminControler.categories`)
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
};