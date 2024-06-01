const mongoose = require("mongoose");
const { type } = require("os");

const productSchema = new mongoose.Schema({
    name: {
         type: String,
        required: true 
    },
    description: { 
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    brand: {
        type: String,
        required: true
    },
    gender:{
        type:String,
        required: true
    },
    material: {
        type: String,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        required: true
    },
    isVariant: { 
        type: Boolean,
        default: false
    },
    variant: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Variant'
    },
    createdAt: {
        type: Date,
       default: Date.now()
    }
})


module.exports = mongoose.model('Product', productSchema);