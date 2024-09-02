const Order = require("../Model/orderModel");
const ReturnRequest = require("../Model/returnRequestModel");


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


module.exports = {
    returnOrder,

}