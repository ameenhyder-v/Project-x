const Address = require("../Model/addressModel");
const Cart = require("../Model/cartModel");
const cartController = require("../Controller/cartController");
const Variant = require("../Model/variantModel");
const User = require("../Model/userModel")
const Order = require("../Model/orderModel");
const Coupon = require("../Model/coupon-model")
const Category = require("../Model/categoryModel");
require('dotenv').config();
const crypto = require('crypto')

//REQUIRING RAZORPAY
const razorpay = require('razorpay');
const { constrainedMemory } = require("process");
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


//? LOAD CHECK OUT PAGE 
const checkOut = async (req, res) => {
    try {
        const userId = req.session.userId;

        const totalAmount = await cartController.subTotal(userId);

        const cartData = await Cart.findOne({ userId: userId }).populate({
            path: 'cartItems.variantId',
            populate: {
                path: 'productId',
                model: 'Product'
            }
        });

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return res.render("checkOut", { addresses: [], cartItems: [], totalAmount: 0, message: "Your cart is empty." });
        }

        const availableCartItems = cartData.cartItems.filter(item => {
            const variant = item.variantId;
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            return stockItem && stockItem.quantity >= item.quantity;
        });

        const addresses = await Address.find({ userId: userId });
        // console.log(availableCartItems)

        res.render("checkOut", { addresses, cartItems: availableCartItems, totalAmount });
    } catch (error) {
        console.error(`Error from the cart controller checkout function: ${error}`);
        res.status(500).send("An error occurred while processing your request.");
    }
}

//? PLACING THE OREDER WITH COD
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod } = req.body;
        const couponCode = req.session.couponCode;

        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const userData = await User.findById(userId);

        const cartData = await Cart.findOne({ userId }).populate({
            path: 'cartItems.variantId',
            populate: {
                path: 'productId',
                populate: {
                    path: 'categoryId', 
                    model: 'Category',
                },
            },
        });


        if (!cartData || cartData.cartItems.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Filter available items frome the user's cart
        const availableCartItems = cartData.cartItems.filter(item => {
            const stockItem = item.variantId.stock.find(stock => stock.size.trim() === item.size.trim());
            return stockItem && stockItem.quantity >= item.quantity;
        });

        if (availableCartItems.length === 0) {
            return res.status(400).json({ message: 'Some items in your cart are out of stock' });
        }

        const totalAmount = await cartController.subTotal(userId);

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ message: 'Invalid address ID' });
        }

        // Apply coupon discount if available
        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode });
            if (coupon) {
                discount = coupon.amount || 0;
                coupon.userList.push({ userId, couponUsed: true });
                await coupon.save();

                delete req.session.couponCode;
                delete req.session.discountAmount;

            }
        }
        const finalAmount = totalAmount - discount;

        const orderedItems = availableCartItems.map(item => {
            const variant = item.variantId;
            const product = variant.productId;

            return {
                variantId: variant._id,
                product_name: product.name,
                quantity: item.quantity,
                price: variant.price,
                type: product.material,
                category: product.categoryId.category,
                color: variant.color,
                size: item.size.trim(),
            };
        });

        // Creating the order
        const order = new Order({
            userId,
            orderedItems,
            shippingAddress: {
                name: address.name,
                address: address.address,
                country: address.country,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                mobile: address.mobile,
            },
            totalAmount: finalAmount,
            paymentMethod,
            paymentStatus: 'Pending',
            couponDiscount: discount, 
        });

        await order.save();

        const orderId = order._id;

        for (const item of availableCartItems) {
            const variant = await Variant.findById(item.variantId._id);
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());
            if (stockItem) {
                stockItem.quantity -= item.quantity;
            }
            await variant.save();
        }

        // Clear the cart
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { cartItems: [] } }, { new: true });

        // Handle payments
        if (paymentMethod === "COD") {
            res.status(200).json({ message: 'Ordered by COD', orderId });
         } else if (paymentMethod === "razor") {

            const razorpayOrder = await razorpayInstance.orders.create({
                amount: finalAmount * 100,
                currency: 'INR',
                receipt:`RECIPT_IS${ order._id }`
                });
        res.status(200).json({
            message: 'Ordered by Razor',
            razorpayOrderId: razorpayOrder.id,
            userName: userData.name,
            orderId: order._id,
            amount: totalAmount,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID
        });
    }

    } catch (error) {
        console.error("Error in placeOrder:", error);
        res.status(500).json({ message: 'An error occurred while placing the order', error: error.message });
    }
};



//! CONFIRMING THE RAZORPAY PAYMENT AND CHECKING THE HASH
const confirmPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpaySignature) {
            order.paymentStatus = 'Confirmed'
            order.orderStatus = 'Placed';
            await order.save();

            res.status(200).json({ message: 'Success', orderId: order._id });
        } else {
            console.log("else is working")
            res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.log(`error from the checkout contoeller confirm payment = ${error}`)
    }
}


//! APPLYING THE COUPON
const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not logged in",
            });
        }

        const { couponCode } = req.body;

        const coupon = await Coupon.findOne({ couponCode });
        //if coupon not exists
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon code not found",
            });
        }

        // checking the coupon is expired
        const currentDate = new Date();
        if (coupon.expires < currentDate) {
            return res.status(400).json({
                success: false,
                message: "Coupon code has expired",
            });
        }

        // Calculate the total amount of user's cart
        const totalAmount = await cartController.subTotal(userId);

        // Check if total amount meets the minimum required for the coupon
        if (totalAmount < coupon.minimumAmount) {
            return res.status(400).json({
                success: false,
                message: `A minimum purchase of ₹${coupon.minimumAmount} is required to use this coupon`,
            });
        }

        const hasUsedCoupon = coupon.userList.some(user => user.userId.toString() === userId.toString());
        if (hasUsedCoupon) {
            return res.status(400).json({
                success: false,
                message: "You have already used this coupon",
            });
        }
        
        const amountAfterDiscount = totalAmount - coupon.amount;
        const discountAmount = coupon.amount;
        req.session.couponCode = coupon.couponCode;
        req.session.discountAmount = coupon.amount;
        res.json({
            success: true,
            message: "Coupon applied successfully",
            newTotal: amountAfterDiscount,
            couponCode,
            discountAmount
        });

    } catch (error) {
        console.error(`Error in applyCoupon: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "An error occurred while applying the coupon. Please try again later.",
        });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.userId;

        const discountAmount = req.session.discountAmount || 0; 
        delete req.session.couponCode;
        delete req.session.discountAmount; 

        const totalAmount = await cartController.subTotal(userId);

        res.json({
            success: true,
            originalTotal: totalAmount,
            discountAmount: discountAmount // Include the discount amount in the response
        });
    } catch (error) {
        console.log(`Error in removing coupon: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to remove coupon. Please try again.',
        });
    }
};


const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.session.userId

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            res.json({ success: 1, message: "order not find" })
        }
        const userData = await User.findById(userId);
        if(!userData){
            res.json({ success: 1, message: "user not find" })
        }
        const totalAmount = orderData.totalAmount;


        if (orderData.paymentMethod === "razor" && orderData.paymentStatus === "Pending") {

            const razorpayOrder = await razorpayInstance.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: `RECIPT_IS${orderData._id}`
            });
            res.status(200).json({
                message: 'Ordered by Razor',
                razorpayOrderId: razorpayOrder.id,
                userName: userData.name,
                orderId: orderData._id,
                amount: totalAmount,
                currency: 'INR',
                key: process.env.RAZORPAY_KEY_ID
            });
        }



    } catch (error) {
        console.log(`error in the order controller retry payment function : ${error.message}`)
    }
}


module.exports = {
    checkOut,
    placeOrder,
    confirmPayment,
    applyCoupon,
    removeCoupon,
    retryPayment
}