const User = require("../Model/userModel");


const isLogin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            console.log("User not logged in.");
            req.flash("message", "Please login first");
            return res.redirect("/login");
        }

        const { userId } = req.session;
        // console.log(userId)
        const userData = await User.findOne({ _id: userId });
        // console.log(userData);

        if (!userData) {
            // console.log("User not found or session expired.");
            req.flash("message", "User not found or session expired.");
            return res.redirect("/login");
        }

        if (userData.isBlocked == true) {
            // console.log("User account is blocked.");
            req.flash("message", "Your account is blocked by the Admin.");
            return res.redirect("/login");
        }

        // console.log("User authenticated, proceeding to next middleware.");
        next();
    } catch (error) {
        console.error(`Error in isLogin middleware: ${error.message}`);
        res.status(500).send("Internal Server Error");
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
