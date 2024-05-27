const register = async(req,res) =>{
    try{
        res.render('register')
    }
    catch(error){
        console.log(`error from register: ${error}`);
    }
}
const home = async(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(`error from home: ${error}`);
    }
}
const productDetails = async(req,res) => {
    try {
        res.render("productDetail")
    } catch (error) {
        console.log(`error from productDetails: ${error}`);
    }
}
const userLogin = async(req,res) => {
    try {
        res.render("login")
    } catch (error) {
        console.log(`error from userLogin: ${error}`);
    }
}

const allProducts = async(req,res) => {
    try {
        res.render("allProducts")
    } catch (error) {
        console.log(`error from allProducts: ${error}`)
    }
}

const shopingCart = async(req,res) => {
    try {
        res.render("shoping-cart")
    } catch (error) {
        console.log(`error from shoping cart: ${error}`)
    }
}
 
const otp = async(req, res) => {
    try {
        res.render("otp")
    } catch (error) {
        console.log(`error form the userController.otp: ${error}`)
    }
}


module.exports = {
  register,
  home,
  productDetails,
  userLogin,
  allProducts,
  shopingCart,
  otp,
};