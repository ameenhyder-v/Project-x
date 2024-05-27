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


const orders = async(req, res) => {
    try {
        res.render("orders")
    } catch (error) {
        console.log(`error from the admin controler.orders: ${error}`)
    }
}

module.exports = {
  dashboard,
  productList,
  orders,
  adminLogin,
};