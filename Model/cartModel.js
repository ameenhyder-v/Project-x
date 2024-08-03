const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cartItems: [{
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            required: true
        },
        size:{
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            required: true
        }
    }]
    
}, {
    timestamps: true
}
)

module.exports = mongoose.model("Cart", cartSchema);
