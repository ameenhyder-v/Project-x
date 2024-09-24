const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    selectionType: {
        type: String,
        enum: ['category', 'product'],
        required: true,
    },
    selectedItemId: {
        type: mongoose.Schema.Types.ObjectId, 
        refPath: 'selectionType', 
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    whichField: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Offer", offerSchema);
