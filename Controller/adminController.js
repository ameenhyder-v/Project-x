const adminLogin = async(req, res) => {
    try {
        res.render("admin_login")
    } catch (error) {
        console.log(`errof form the admin Login : ${error}`)
    }
}

const dashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(`error from dashboaer: ${error}`);
  }
};

const productList = async(req,res) => {
     try {
        res.render("productList")
     } catch (error) {
        console.log(`error form productList loding: ${error}`)
     }
}

const addProduct = async(req, res) => {
    try {
        res.render("addProducts");
    } catch (error) {
        console.log(`error from the admincontroler addProduct ${error}`)
    }
}

const orders = async(req, res) => {
    try {
        res.render("orders")
    } catch (error) {
        console.log(`error from the admin controller.orders: ${error}`)
    }
}

const allUsers = async(req,res) => {
    try{
        res.render("users")
    } catch (error){
        console.log(`error from the adminController.allUsers: ${error}`)
    }
}

const userDetails = async(req, res) => {
    try{
        res.render("userDetails");
    } catch (error) {
        console.log(`error from the adminController.userDetails: ${error}`)
    }
}


const categories = async(req, res) => {
     try {
        res.render("categories");
     } catch (error) {
        console.log(`error form the adminControler.categories`)
     }
}

module.exports = {
  dashboard,
  productList,
  orders,
  adminLogin,
  addProduct,
  allUsers,
  userDetails,
  categories,
};