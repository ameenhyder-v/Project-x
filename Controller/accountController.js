const User = require("../Model/userModel")
const Address = require("../Model/addressModel")
const Order = require("../Model/orderModel")
const Transaction = require("../Model/transactionModel")
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');



const accountLoad = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userData = await User.findOne({_id: userId});
        const userAddress = await Address.find({userId: userId});
        const transactions = await Transaction.find({ userId: userId }).sort({ createdAt: -1 }); // Sorted by most recent first
        const orders = await Order.find({userId});
        
        res.render("userAccount", { userData, userAddress, orders, transactions })
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


        const orders = await Order.find({ userId })
            .sort({ _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalOrders = await Order.countDocuments({ userId });


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

//? ADDING ADDRESS TO THE DB
const addingAddress = async (req, res) => {
    const { name, address, country, state, city, pincode, mobile } = req.body;
    const userId = req.session.userId;

    try {
        if (!userId) {
            req.flash("message", "There is no user found");
            return res.redirect("/add-address");
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
        });

        // Validating name
        if (!addressData.name || addressData.name.trim().length < 3 || addressData.name.trim().length > 50) {
            req.flash("message", "Name must be between 3 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating address
        if (!addressData.address || addressData.address.trim().length < 10 || addressData.address.trim().length > 50) {
            req.flash("message", "Address must be between 10 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating country
        if (!addressData.country || addressData.country.trim().length < 4 || addressData.country.trim().length > 50) {
            req.flash("message", "Country must be between 4 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating state
        if (!addressData.state || addressData.state.trim().length < 4 || addressData.state.trim().length > 30) {
            req.flash("message", "State must be between 4 and 30 characters.");
            return res.redirect("/add-address");
        }

        // Validating city
        if (!addressData.city || addressData.city.trim().length < 4 || addressData.city.trim().length > 30) {
            req.flash("message", "City must be between 4 and 30 characters.");
            return res.redirect("/add-address");
        }

        // Validating pincode
        if (!addressData.pincode || !/^[0-9]{6}$/.test(addressData.pincode)) {
            req.flash("message", "Pincode must be 6 digits numbers.");
            return res.redirect("/add-address");
        }

        // Validating mobile
        if (!addressData.mobile || !/^[0-9]{10}$/.test(addressData.mobile)) {
            req.flash("message", "Mobile must be exactly 10 digits.");
            return res.redirect("/add-address");
        }

        const save = await addressData.save();
        if (save) {
            res.redirect("/my-account");
        }
    } catch (error) {
        console.error("error from the account controller adding address -  ", error);
        req.flash("message", "An error occurred while adding the address. Please try again.");
        res.redirect("/add-address");
    }
};

//!  GETTING ADDRESS FOR EDIT 
const getAddressForEdit = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.query;


        const address = await Address.findById(addressId);

        if (!address || address.userId.toString() !== userId) {
            return res.status(404).json({ message: 'Address not found!' });
        }

        res.json(address);
    } catch (error) {
        console.log(`Error from the account controller getAddressForEdit - ${error}`);
        res.status(404).json({ message: 'Internal server error' });
    }
};


//! UPDATEING ADDRESS 
const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.query;
        const { name, address, country, state, city, pincode, mobile } = req.body;

        // Validation
        let errors = [];

        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            errors.push("Name must be between 3 and 50 characters.");
        }

        if (!address || address.trim().length < 10 || address.trim().length > 50) {
            errors.push("Address must be between 10 and 50 characters.");
        }

        if (!country || country.trim().length < 4 || country.trim().length > 50) {
            errors.push("Country must be between 4 and 50 characters.");
        }

        if (!state || state.trim().length < 4 || state.trim().length > 30) {
            errors.push("State must be between 4 and 30 characters.");
        }

        if (!city || city.trim().length < 4 || city.trim().length > 30) {
            errors.push("City must be between 4 and 30 characters.");
        }

        if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
            errors.push("Pincode must be 6 digits.");
        }

        if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
            errors.push("Mobile must be exactly 10 digits.");
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Update address in the database
        const updatedAddress = await Address.findByIdAndUpdate(addressId, {
            name,
            address,
            country,
            state,
            city,
            pincode,
            mobile
        }, { new: true });

        if (!updatedAddress) {
            return res.status(400).json({ errors: "Failed to update address." });
        }

        res.status(200).json({ message: "Address updated successfully."});

    } catch (error) {
        console.log(`Error from the account controller updating the address: ${error}`);
        res.status(500).json({ error: "Internal server error." });
    }
};


//! ADDING ADDRESS FROM CHECKOUT PAGE 
const addAddressFromCheckout = async (req, res) => {
    const { name, address, country, state, city, pincode, mobile } = req.body;
    const userId = req.session.userId;

    try {
        if (!userId) {
            req.flash("message", "There is no user found");
            return res.redirect("/add-address");
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
        });

        // Validating name
        if (!addressData.name || addressData.name.trim().length < 3 || addressData.name.trim().length > 50) {
            req.flash("message", "Name must be between 3 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating address
        if (!addressData.address || addressData.address.trim().length < 10 || addressData.address.trim().length > 50) {
            req.flash("message", "Address must be between 10 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating country
        if (!addressData.country || addressData.country.trim().length < 4 || addressData.country.trim().length > 50) {
            req.flash("message", "Country must be between 4 and 50 characters.");
            return res.redirect("/add-address");
        }

        // Validating state
        if (!addressData.state || addressData.state.trim().length < 4 || addressData.state.trim().length > 30) {
            req.flash("message", "State must be between 4 and 30 characters.");
            return res.redirect("/add-address");
        }

        // Validating city
        if (!addressData.city || addressData.city.trim().length < 4 || addressData.city.trim().length > 30) {
            req.flash("message", "City must be between 4 and 30 characters.");
            return res.redirect("/add-address");
        }

        // Validating pincode
        if (!addressData.pincode || !/^[0-9]{6}$/.test(addressData.pincode)) {
            req.flash("message", "Pincode must be 6 digits numbers.");
            return res.redirect("/add-address");
        }

        // Validating mobile
        if (!addressData.mobile || !/^[0-9]{10}$/.test(addressData.mobile)) {
            req.flash("message", "Mobile must be exactly 10 digits.");
            return res.redirect("/add-address");
        }

        const save = await addressData.save();
        if (save) {
            res.redirect("/checkout");
        }
    } catch (error) {
        console.error( "error form the account controller adding address from the checkout -  ",error);
        req.flash("message", "An error occurred while adding the address. Please try again.");
        res.redirect("/add-address");
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { userId } = req.session;
        const { addressId } = req.query;

        const address = await Address.findOne({ _id: addressId, userId });

        if (!address) {
            return res.status(400).json({ error: 'Address not found or does not belong to the user.' });
        }

        const deleted =  await Address.deleteOne({ _id: addressId });

        if (deleted){
            return res.status(200).json({ message: 'Address deleted successfully.' });
        }
    } catch (error) {
        console.log(`error from the account controller delete address - ${error}`);
        res.status(400).json({ error: 'An error occurred while deleting the address. Please try again.' });
    }
};


const orderSummary = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { orderId } = req.query;

        // Validate orderId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).send("Invalid order ID format");
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.variantId',
                populate: {
                    path: 'productId',
                    model: 'Product'
                }
            });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const user = await User.findById(userId);

        res.render("orderSummary", { order, user });
    } catch (error) {
        console.error("Error from the account controller . orderSummary: ", error.message);
        res.status(500).send("Internal server error");
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, email } = req.body;

        const name1 = name.trim();

        const email1 = email.trim();

        //? Name validation
        const nameRegex = /^[A-Za-z\s]+$/;
        const isValidName = nameRegex.test(name1);
        if (!isValidName) {
            return res.json({ success: false, message: "Invalid name. Name should contain only letters and spaces." });
        }

        //? Check if name already exists
        const nameAlreadyExists = await User.findOne({ name: name1 });
        if (nameAlreadyExists && nameAlreadyExists._id.toString() !== userId) {
            return res.json({ success: false, message: "This name is already taken." });
        }

        //? Email validation
        const emailRegex = /\S+@\S+\.\S+/;
        const isValidEmail = emailRegex.test(email1);
        if (!isValidEmail) {
            return res.json({ success: false, message: "Invalid email format." });
        }

        //? Check if email already exists
        const emailAlreadyExists = await User.findOne({ email: email1 });
        if (emailAlreadyExists && emailAlreadyExists._id.toString() !== userId) {
            return res.json({ success: false, message: "This email is already taken." });
        }

        //? Updating user details
        const updatedUser = await User.findByIdAndUpdate(userId, { name: name1, email: email1 }, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found." });
        }

        return res.json({ success: true, message: "User details updated successfully." });
    } catch (error) {
        console.error("Error occurred: ", error.message);
        res.json({ success: false, message: "Server error." });
    }
};



const changePassword = async (req, res) => {
    try {
        const { userId } = req.session; 
        const { currentPass, newPass, confirmPass } = req.body; 


        if (newPass !== confirmPass) {
            return res.json({ success: false, message: "New password and confirm password do not match." });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(newPass)) {
            return res.json({ success: false, message: "Password must be at least 8 characters long, contain at least one capital letter, and one number." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found."});
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) {
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


        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(newPass)) {
            return res.json({success: false, message: 'Password must be at least 8 characters long, contain at least one capital letter, and one number.' });
        }

        //? pass match
        if (newPass !== confirmPass) {
            return res.json({success: false, message: 'Passwords do not match' });
        }

        //? hash pass
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);

        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.log(`error from the account controller change password: ${error}`);
        res.json({ success: false, message: 'Internal server error' });
    }
};


const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                res.redirect("/")
            }
            res.redirect("/");
        });
    } catch (error) {
        console.log("Unexpected error from the account controller logout:", error);
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
    allOrders,
    getAddressForEdit,
    updateAddress,
    deleteAddress,
    logout
}