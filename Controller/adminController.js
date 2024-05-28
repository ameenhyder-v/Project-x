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
  }

  if (!passwordRegex.test(password)) {
    return res.render("admin_login",{ message: "Password must be at least 8 characters long and include at least one uppercase letter and one number." });
  }

  if (username === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    return res.render("dashboard");
  } else {
    return res.render("admin_login",{ message: "Invalid username or password." });
  }
}

// const dashboard = async (req, res) => {
//     try {
//         res.render("dashboard");
//     } catch (error) {
//         console.log(`error from dashboaer: ${error}`);
//     }
// };

const productList = async (req, res) => {
    try {
        res.render("productList")
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
        res.render("users")
    } catch (error) {
        console.log(`error from the adminController.allUsers: ${error}`)
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
        res.render("categories");
    } catch (error) {
        console.log(`error form the adminControler.categories`)
    }
}

module.exports = {
    verifyAdmin,
    // dashboard,
    productList,
    orders,
    adminLogin,
    addProduct,
    allUsers,
    userDetails,
    categories,
};