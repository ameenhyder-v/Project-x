const mongoose = require("mongoose")

const variantScema = new mongoose.Schema({
    color: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    image: {
        type: [String],
        required: true
    },
    stock: [    { size: { type: String, required: true } ,  quantity: { type: Number, required: true } , price: { type: Number, required: true } }],
    isListed:{
        type: Boolean,
        default: true
    },
    addedAt: {
        type: Date,
        default: Date.now()
    }

})

module.exports = mongoose.model("Variant", variantScema);