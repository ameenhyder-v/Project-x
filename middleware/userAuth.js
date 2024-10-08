const User = require("../Model/userModel");
// const cartController = require("../Controller/cartController")


const isLogin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            req.flash("message", "Please login first");
            return res.redirect("/login");
        }

        const { userId } = req.session;
        const userData = await User.findOne({ _id: userId });

        if (!userData) {
            req.flash("message", "User not found or session expired.");
            return res.redirect("/login");
        }

        if (userData.isBlocked == true) {
            req.flash("message", "Your account is blocked by the Admin.");
            return res.redirect("/login");
        }

        next();
    } catch (error) {
        console.error(`Error in isLogin middleware: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
};



const isLogout = async (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect('/');
        }

        next();
    } catch (error) {
        console.error(`Error in isLogout middleware: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
};

function addUserToLocals(req, res, next) {
    res.locals.user = req.session.userId || null; 
    next()
}

module.exports = {
    isLogin,
    isLogout,
    addUserToLocals
}
