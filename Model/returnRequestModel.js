const mongoose = require("mongoose");

const retrenReqSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    reason: {
        type: String,
        required: true
    },
    orderDataId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Order"
    }

})


module.exports = mongoose.model("ReturnRequest", retrenReqSchema);