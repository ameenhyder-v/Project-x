const isLogin = async (req, res, next) => {
    try {
        if (!req.session.admin) {
            req.flash("error", "Please login first");
            return res.redirect("/admin");
        }

        next();
    } catch (error) {
        console.error(`Error in adminAuth isLogin middleware: ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) {
            return res.redirect("/admin/dashboard");
        }
        next();
        
    } catch (error) {
        console.log(`error in the adminAuth isLogout middleware:  ${error}`);
    }
}

module.exports = {
    isLogin,
    isLogout
}