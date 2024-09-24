const Order = require("../Model/orderModel");
const ReturnRequest = require("../Model/returnRequestModel");
const Variant = require("../Model/variantModel");
const User = require("../Model/userModel");
const Transaction = require("../Model/transactionModel")


//! USER TRYING TO RETURN THE ORDER
const returnOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { orderId, reason } = req.body;
        console.log(orderId, "===orderid  \n  reason:   : ", reason);

        if (!reason || reason.trim() == " ") {
            return res.status(400).send({ success: false, message: 'Reason is required not be space' });
        }
        
        const orderData = await Order.findById(orderId);

        if (!orderData) {
            return res.status(404).send({ success: false, message: 'Order not found' });
        }

        if (orderData.orderStatus === 'Return Requested' || orderData.orderStatus === 'Returned') {
            return res.status(400).send({ success: false, message: 'Return request already made or order already returned' });
        }

        const newReturnRequest = new ReturnRequest({
            user: userId,
            reason: reason,
            orderDataId: orderId
        });

        await newReturnRequest.save();

        orderData.orderStatus = 'Return Requested';
        await orderData.save();

        res.send({ success: true, message: 'Return request successfully submitted' });
    } catch (error) {
        console.log(`error in the order controller returnOrder fn :  ${error.message}`);
    }
}



//! USER CANCELING THE ORDER 
const cancelOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { orderId } = req.query;
        const { reason } = req.body;

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            return res.status(404).json({ message: "Order not found" });
        }

        for (const item of orderData.orderedItems) {
            const variant = await Variant.findById(item.variantId);
            if (variant) {
                const stockItem = variant.stock.find(s => s.size.trim() === item.size.trim());
                if (stockItem) {
                    stockItem.quantity += item.quantity;
                }
                await variant.save();
            }
        }

        if (orderData.paymentMethod === "razor" && orderData.paymentStatus === "Confirmed") {
            const refundAmount = orderData.totalAmount;
            const user = await User.findById(userId);
            user.wallet += refundAmount; 
            await user.save();

            const transaction = new Transaction({
                userId: userId,
                amount: refundAmount,
                type: 'credit'
            });
            await transaction.save();
        }

        orderData.orderStatus = 'Canceled';
        orderData.cancellationReason = reason;
        await orderData.save();

        return res.json({ success: true, message: "Order canceled and stock updated" });

    } catch (error) {
        console.log(`Error in the Order Controller cancel order fn: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};




module.exports = {
    returnOrder,
    cancelOrder,

}