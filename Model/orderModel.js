const mongoose = require("mongoose");

const generateOrderId = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
   },
    orderedItems: [
        {
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Variant",
                required: true
            },
            product_name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            category: {
                type: String,
                required: true
            },
            color: {
                type: String,
                required: true
            },
            size: {
                type: String,
                required: true
            },
            
            orderedDate: {
                type: Date,
                default: Date.now()
            },
        }
   ],
   shippingAddress: {
        name: { type: String, required: true},
        address: { type: String, required: true },
        country: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: Number, required: true },
        mobile: { type: Number, required: true },
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'COD'
    },
    orderId: {
        type: Number,
        default: () => generateOrderId()
    },
    orderStatus: {
        type: String,
        default: 'Pending',
    },
    paymentStatus: {
        type: String,
    },
})

const Order = mongoose.model('Order', orderSchema)
module.exports = Order