const Order = require("../Model/orderModel");
const ReturnRequest = require("../Model/returnRequestModel");
const Variant = require("../Model/variantModel");
const User = require("../Model/userModel");
const Transaction = require("../Model/transactionModel");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');



//! USER TRYING TO RETURN THE ORDER
const returnOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { orderId, reason } = req.body;

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


//! SALES REPORT GENERATING AND SHOWING
const salesReport = async (req, res) => {
    const { page = 1, limit = 10, dateRange, startDate, endDate } = req.query;

    const query = {
        orderStatus: 'Delivered'
    };
    // range query bulding
    if (dateRange === 'custom' && startDate && endDate) {

        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (dateRange === 'daily') {
        const today = new Date();
        query.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) };
    } else if (dateRange === 'LastWeek') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query.createdAt = { $gte: lastWeek }; 
    } else if (dateRange === 'monthly') { 
        const startOfMonth = new Date();
        startOfMonth.setDate(1); 
        query.createdAt = { $gte: startOfMonth };
    } else if (dateRange === 'yearly') {
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear(), 0, 1); 
        query.createdAt = { $gte: startOfYear };
    }

    try {
        const orders = await Order.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const totalOrders = await Order.countDocuments(query);
        const totalSalesCount = totalOrders;
        const totalOrderAmount = orders.reduce((total, order) => total + order.totalAmount, 0);
        const totalDiscount = orders.reduce((total, order) => total + (order.totalOfferAmount || 0), 0);

        res.render('sales', {
            orderList: orders,
            currentPage: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(totalOrders / limit),
            totalSalesCount,
            totalOrderAmount,
            totalDiscount,
            dateRange,
            startDate,
            endDate
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


//! DOWNLOAD PDF 
const downloadReportPdf = async (req, res) => {
    const { dateRange, startDate, endDate } = req.query;

    const query = {
        orderStatus: 'Delivered',
    };

    // Build the query based on the selected date range
    if (dateRange === 'custom' && startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (dateRange === 'daily') {
        const today = new Date();
        query.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) }; 
    } else if (dateRange === 'LastWeek') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query.createdAt = { $gte: lastWeek };
    } else if (dateRange === 'monthly') { 
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        query.createdAt = { $gte: startOfMonth };
    } else if (dateRange === 'yearly') {
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear(), 0, 1);
        query.createdAt = { $gte: startOfYear };
    }

    try {
        const orders = await Order.find(query);

        const doc = new PDFDocument();
        let filename = 'sales_report.pdf';
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.font('Helvetica');
        doc.pipe(res);

        // Title
        doc.fontSize(25).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // Table Header
        const header = ['Name', 'Mobile', 'Total Amount', 'Discount', 'Status', 'Date', 'Payment Method'];
        const headerRow = header.join(' | ');
        
        doc.fontSize(12).text(headerRow, { align: 'left' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); 

        // Table Rows
        orders.forEach((order) => {
            const name = order.shippingAddress?.name || 'N/A';
            const mobile = order.shippingAddress?.mobile || 'N/A';
            const totalAmount = `₹${order.totalAmount.toFixed(2)}`;
            const discount = `₹${order.totalOfferAmount ? order.totalOfferAmount.toFixed(2) : '0.00'}`;
            const status = order.orderStatus;
            const date = new Date(order.createdAt).toDateString();
            const paymentMethod = order.paymentMethod;

            const row = [name, mobile, totalAmount, discount, status, date, paymentMethod].join(' | ');
            doc.moveDown();
            doc.text(row);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

            doc.moveDown();
        });

        // Overall Summary
        const totalSalesCount = orders.length;
        const totalOrderAmount = orders.reduce((total, order) => total + order.totalAmount, 0);
        const totalDiscount = orders.reduce((total, order) => total + (order.totalOfferAmount || 0), 0);

        doc.moveDown(); 
        doc.moveDown();
        doc.fontSize(16).text(`Total Sales Count: ${totalSalesCount}`);
        doc.text(`Total Order Amount: ₹${totalOrderAmount.toFixed(2)}`);
        doc.text(`Total Discount: ₹${totalDiscount.toFixed(2)}`);

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


//! DOWNLOAD EXCEL
const downloadReportExcel = async (req, res) => {
    const { dateRange, startDate, endDate } = req.query;

    const query = {
        orderStatus: 'Delivered',
    };

    if (dateRange === 'custom' && startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (dateRange === 'daily') {
        const today = new Date();
        query.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) };
    } else if (dateRange === 'LastWeek') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        query.createdAt = { $gte: lastWeek };
    } else if (dateRange === 'monthly') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        query.createdAt = { $gte: startOfMonth };
    } else if (dateRange === 'yearly') {
        const startOfYear = new Date();
        startOfYear.setFullYear(startOfYear.getFullYear(), 0, 1);
        query.createdAt = { $gte: startOfYear };
    }

    try {
        const orders = await Order.find(query);

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define Columns
        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Mobile', key: 'mobile', width: 30 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Discount', key: 'discount', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        ];

        // Add Rows
        orders.forEach((order, index) => {
            worksheet.addRow({
                orderNumber: index + 1,
                name: order.shippingAddress?.name || 'N/A',
                mobile: order.shippingAddress?.mobile || 'N/A', 
                totalAmount: `₹${order.totalAmount.toFixed(2)}`,
                discount: `₹${order.totalOfferAmount ? order.totalOfferAmount.toFixed(2) : '0.00'}`,
                status: order.orderStatus,
                date: new Date(order.createdAt).toLocaleDateString(), 
                paymentMethod: order.paymentMethod,
            });
        });

        // Overall Summary
        worksheet.addRow({});
        worksheet.addRow({ name: 'Overall Summary', totalAmount: '', discount: '', status: '', date: '', paymentMethod: '' });
        worksheet.addRow({ name: 'Total Sales Count', totalAmount: orders.length, discount: '', status: '', date: '', paymentMethod: '' });
        worksheet.addRow({ name: 'Total Order Amount', totalAmount: `₹${orders.reduce((total, order) => total + order.totalAmount, 0).toFixed(2)}`, discount: '', status: '', date: '', paymentMethod: '' });
        worksheet.addRow({ name: 'Total Discount', totalAmount: `₹${orders.reduce((total, order) => total + (order.totalOfferAmount || 0), 0).toFixed(2)}`, discount: '', status: '', date: '', paymentMethod: '' });

        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Server Error');
    }
}



//! SALES CHART 
const salesChart = async (req, res) => {
    const filter = req.query.filter;
    let matchCondition = { orderStatus: 'Delivered' };
    let groupBy;

    const now = new Date();
    let startDate;

    if (filter === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
        };
    } else if (filter === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 7));
        groupBy = { $week: '$createdAt' }; 
    } else if (filter === 'monthly') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        groupBy = { $month: '$createdAt' };
    } else if (filter === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = { $year: '$createdAt' }; 
    } else {
        return res.status(400).send('Invalid filter type');
    }

    matchCondition.createdAt = { $gte: startDate };

    try {
        const salesData = await Order.aggregate([
            { $match: matchCondition },
            { $group: { _id: groupBy, total: { $sum: '$totalAmount' } } },
            { $sort: { _id: 1 } }
        ]);

        const labels = salesData.map(data => {
            if (filter === 'daily') {
                const date = new Date(data._id.year, data._id.month - 1, data._id.day);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else if (filter === 'weekly') {

                const startOfWeek = new Date(now.getFullYear(), 0, data._id * 7 - 6);
                const endOfWeek = new Date(now.getFullYear(), 0, data._id * 7);
                return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
            
            } else if (filter === 'monthly') {

                return new Date(now.getFullYear(), data._id - 1).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'                                                                                           
                });
            } else if (filter === 'yearly') {
                
                return data._id;
            }
        });

        const values = salesData.map(data => data.total);

        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};



module.exports = {
    returnOrder,
    cancelOrder,
    salesReport,
    downloadReportPdf,
    downloadReportExcel,
    salesChart

}