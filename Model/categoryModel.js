const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Category", categorySchema);
