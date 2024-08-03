const User = require("../Model/userModel")
const Address = require("../Model/addressModel")
const Order = require("../Model/orderModel")
const bcrypt = require("bcrypt");


const accountLoad = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userData = await User.findOne({_id: userId});
        const userAddress = await Address.find({userId: userId});
        const orders = await Order.find({userId});
        console.log(orders)
        
        res.render("userAccount", {userData, userAddress, orders})
    } catch (error) {
        console.log(`error from the account controller . account load:  ${error}`)
    }
}

//? USER'S ALL ORDERS PAGE 

const allOrders = async (req, res) => {
    try {
        const { userId } = req.session;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        console.log(userId);

        const orders = await Order.find({ userId })
            .sort({ _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalOrders = await Order.countDocuments({ userId });

        console.log(orders);

        res.render("allOrders", { orders, page, limit, totalOrders });
    } catch (error) {
        console.log(`error from the account controller all orders - ${error}`);
    }
};


//? add address page load
const addAddress = async (req, res) => {
    try {
        const message = req.flash("message")
        
        res.render("addAddress", { message })
        
    } catch (error) {
        
    }
}

const addingAddress = async (req, res) => {
    const { name, address, country, state, city, pincode, mobile } = req.body


    const  userId  = req.session.userId;
    if (!userId){
        req.flash("message", "There is no user found")
        return res.redirect("/add-address")
    }

    const addressData = new Address({
        userId: userId,
        name: name ,
        address: address,
        country: country,
        state: state,
        city: city,
        pincode:pincode,
        mobile:mobile
    })



    // Validating name
    if (!addressData.name || addressData.name.trim().length < 3 || addressData.name.trim().length > 50) {
        req.flash("message", "Name must be between 3 and 50 characters.")
        return res.redirect("/add-address");
    }
    // Validating address
    if (!addressData.address || addressData.address.trim().length < 10 || addressData.address.trim().length > 50) {
        req.flash("message", "Address must be between 10 and 50 characters.");
        return res.redirect("/add-address")
    }
    
    // Validating country
    if (!addressData.country || addressData.country.trim().length < 4 || addressData.country.trim().length > 50) {
        req.flash("message", "Country must be between 4 and 50 characters.");
        return res.redirect("/add-address")
    }

    // Validateing state
    if (!addressData.state || addressData.state.trim().length < 4 || addressData.state.trim().length > 30) {
        req.flash("message", "State must be between 4 and 30 characters.");
        return res.redirect("/add-address")
    }
    

    // Validateing city
    if (!addressData.city || addressData.city.trim().length < 4 || addressData.city.trim().length > 50) {
        req.flash("message", "City must be between 4 and 30 characters.");
        return res.redirect("/add-address")
    }

    // Validateing pincode
    if (!addressData.pincode || !/^[0-9]{6}$/.test(addressData.pincode)) {
        errors.pincode = 'Pincode must be 6 digits numbers.';
    }

    // Validateing mobile
    if (!addressData.mobile || !/^[0-9]{10}$/.test(addressData.mobile)) {
        errors.mobile = 'Mobile must be exactly 10 digits.';
    }
    
    const save = await addressData.save();
    if(save) {
        console.log(save)
        res.redirect("/my-account")
    }

}



const addAddressFromCheckout = async (req, res) => {
    const { name, address, country, state, city, pincode, mobile } = req.body


    const userId = req.session.userId;
    if (!userId) {
        req.flash("message", "There is no user found")
        return res.redirect("/add-address")
    }

    const addressData = new Address({
        userId: userId,
        name: name,
        address: address,
        country: country,
        state: state,
        city: city,
        pincode: pincode,
        mobile: mobile
    })



    if (!addressData.name || addressData.name.trim().length < 3 || addressData.name.trim().length > 50) {
        req.flash("message", "Name must be between 3 and 50 characters.")
        return res.redirect("/add-address");
    }
    if (!addressData.address || addressData.address.trim().length < 10 || addressData.address.trim().length > 50) {
        req.flash("message", "Address must be between 10 and 50 characters.");
        return res.redirect("/add-address")
    }

    if (!addressData.country || addressData.country.trim().length < 4 || addressData.country.trim().length > 50) {
        req.flash("message", "Country must be between 4 and 50 characters.");
        return res.redirect("/add-address")
    }

    if (!addressData.state || addressData.state.trim().length < 4 || addressData.state.trim().length > 30) {
        req.flash("message", "State must be between 4 and 30 characters.");
        return res.redirect("/add-address")
    }


    if (!addressData.city || addressData.city.trim().length < 4 || addressData.city.trim().length > 50) {
        req.flash("message", "City must be between 4 and 30 characters.");
        return res.redirect("/add-address")
    }

    if (!addressData.pincode || !/^[0-9]{6}$/.test(addressData.pincode)) {
        errors.pincode = 'Pincode must be 6 digits numbers.';
    }

    if (!addressData.mobile || !/^[0-9]{10}$/.test(addressData.mobile)) {
        errors.mobile = 'Mobile must be exactly 10 digits.';
    }

    const save = await addressData.save();
    if (save) {
        console.log(save)
        res.redirect("/checkout")
    }

}


const orderSummary = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { orderId } = req.query;

        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.variantId',
                populate: {
                    path: 'productId',
                    model: 'Product'
                }
            });

        if (!order) {
            console.log("order not getting")
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("user not find")
        }

        res.render("orderSummary", { order, user });

    } catch (error) {
        console.log("error from the account controller . orderSummary ", error.message);
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name1, email1 } = req.body;

        const name = name1.trim()
        const email = email1.trim()


        //? name validation
        const nameRegex = /^[A-Za-z\s]+$/;
        const isValidName = nameRegex.test(name);
        if (!isValidName) {
            return res.json({ success: false, message: "Invalid name. Name should contain only letters and spaces." });
        }

        //? if name already exists
        const nameAlreadyExists = await User.findOne({ name });
        if (nameAlreadyExists && nameAlreadyExists._id.toString() !== userId) {
            return res.json({ success: false, message: "This name is already taken." });
        }

        //? email validation
        const emailRegex = /\S+@\S+\.\S+/;
        const isValidEmail = emailRegex.test(email);
        if (!isValidEmail) {
            return res.json({ success: false, message: "Invalid email format." });
        }

        //? if email already exists
        const emailAlreadyExists = await User.findOne({ email });
        if (emailAlreadyExists && emailAlreadyExists._id.toString() !== userId) {
            return res.json({ success: false, message: "This email is already taken." });
        }

        //? then updating 
        const updatedUser = await User.findByIdAndUpdate( userId, { name, email }, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found." });
        }

        return res.json({ success: true, message: "User details updated successfully." });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error." });
    }
};


const changePassword = async (req, res) => {
    try {
        const { userId } = req.session; 
        const { currentPass, newPass, confirmPass } = req.body; 

        console.log(currentPass, "-------", newPass, "--------", confirmPass, "---------", userId);

        if (newPass !== confirmPass) {
            console.log("pass no match")
            return res.json({ success: false, message: "New password and confirm password do not match." });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(newPass)) {
            console.log("Password must be at least 8 characters")
            return res.json({ success: false, message: "Password must be at least 8 characters long, contain at least one capital letter, and one number." });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("usernot found")
            return res.json({ success: false, message: "User not found."});
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) {
            console.log("'Current password is incorrect.-------------")
            return res.json({ success: false, message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPass, 10);

        // Update the user's password
        user.password = hashedPassword;
        const save = await user.save();
        if (save){
            return res.json({ success: true, message: "Password changed successfully!" });
        }

    } catch (error) {
        console.log(`Error from the account controller changePassword: ${error}`);
        res.json({ success: false, message: "An error occurred while changing the password. "});
    }
};


const addPassword = async (req, res) => {
    try {
        const { userId } = req.session;
        const { newPass, confirmPass } = req.body;

        console.log("-------", newPass, "--------", confirmPass, "---------", userId);

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(newPass)) {
            return res.json({success: false, message: 'Password must be at least 8 characters long, contain at least one capital letter, and one number.' });
        }

        //? pass match
        if (newPass !== confirmPass) {
            console.log("error in th pass match")
            return res.json({success: false, message: 'Passwords do not match' });
        }

        //? hash pass
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);
        if (!hashedPassword){
            console.log("error hashing not working ")
        }

        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.log(`error from the account controller change password: ${error}`);
        res.json({ success: false, message: 'Internal server error' });
    }
};



module.exports = {
    accountLoad,
    addAddress,
    addingAddress,
    addAddressFromCheckout,
    orderSummary,
    updateUserProfile,
    changePassword,
    addPassword,
    allOrders
}