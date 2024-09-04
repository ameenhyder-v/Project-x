const Address = require("../Model/addressModel");
const Cart = require("../Model/cartModel");
const cartContoller = require("../Controller/cartController");
const Variant = require("../Model/variantModel");
const User = require("../Model/userModel")
const Order = require("../Model/orderModel");
require('dotenv').config();
const crypto = require('crypto')

//REQUIRING RAZORPAY
const razorpay = require('razorpay');
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


//? LOAD CHECK OUT PAGE 
const checkOut = async (req, res) => {
    try {
        const userId = req.session.userId;

        const totalAmount = await cartContoller.subTotal(userId);

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
        console.log(paymentMethod, "----------------")

        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

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

        if (availableCartItems.length === 0) {
            return res.status(400).json({ message: 'Some items in your cart are out of stock' });
        }

        const totalAmount = await cartContoller.subTotal(userId);
        
        // Retrieving the shipping address
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ message: 'Invalid address ID' });
        }

        // Create ordered items array
        const orderedItems = availableCartItems.map(item => {
            const variant = item.variantId;
            const product = variant.productId;
            console.log("🚀 ~ orderedItems ~ orderedItems:", item.size.trim())            

            return {
                variantId: variant,
                product_name: product.name,
                quantity: item.quantity,
                price: variant.price,
                type: product.material,
                category: product.category,
                color: variant.color,
                size: item.size.trim(),
            };
        });
        console.log("🚀 ~ orderedItems ~ orderedItems:", orderedItems)

        
        const userData = await User.findById(userId)

        // Create an order
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
                mobile: address.mobile
            },
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            paymentStatus: 'Pending'
        });

        await order.save();
        // console.log(order)

        const orderId = order._id;

        // Reduce stock and update variants
        for (const item of availableCartItems) {
            const variant = await Variant.findById(item.variantId._id);
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            if (stockItem) {
                stockItem.quantity -= item.quantity;
            }

            const saveVariant = await variant.save();
            if (saveVariant){
                console.log("variant updated ")
            }else {
                console.log("variant updation faild")
            }
        }

        // Clear the cart
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { cartItems: [] } });

        if(paymentMethod === "COD"){
            // console.log("cod")
            res.status(200).json({ message: 'Ordered by COD', orderId });
        }else if(paymentMethod === "razor"){
            // console.log("with razor")

            const razorpayOrder = await razorpayInstance.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: `RECIPT_IS${order._id}`
            });
            console.log(razorpayOrder, 'thus s ushdf')
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
}



const confirmPayment = async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create a HMAC using the orderId and razorpayPaymentId
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const generatedSignature = hmac.digest('hex');

        // Verify the payment signature
        if (generatedSignature === razorpaySignature) {
            // Payment is successful and verified
            order.paymentStatus = 'Confirmed'
            order.orderStatus = 'Pending';
            console.log("after saving " , order)
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


module.exports = {
    checkOut,
    placeOrder,
    confirmPayment,
}