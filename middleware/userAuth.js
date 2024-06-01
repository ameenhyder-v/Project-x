const User = require("../Model/userModel");


const isLogin = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const { userId } = req.session;
            const userData = await User.findOne({ _id: userId });

            if (userData) {
                if (userData.isBlocked == true) {
                    // checking the user isBlocked
                    return res.render("login", { message: "Your account is blocked." });
                } else {
                    next();
                }

            } else {
                return res.render("login", { message: "User not found or session expired." });
            }
        } else {
            
            return res.render("login", { message: "Unauthorized, please try again." });
        }
    } catch (error) {
        
        console.error(`Error in isLogin middleware:", ${error.message}`);
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            // user is not in the session
            next();
        } else {

            res.redirect("/");
        }
    } catch (error) {
        console.error(`Error in isLogout middleware: ${error.message}`);
    }
};

module.exports = {
    isLogin,
    isLogout
}
