const Order = require('../Model/orderModel');
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
require('dotenv').config();

// Free tier: omit apiKey so no Authorization header is sent (free endpoint works without it).
// Paid: set EASYINVOICE_API_KEY in .env (get from https://app.budgetinvoice.com → Settings → API keys).

// Generating the invoice using Easy Invoice    
const generateInvoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const orderData = await Order.findById( orderId ).populate('orderedItems.variantId');

        if (!orderData) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const date = orderData.createdAt; 
        const formattedDate = format(date, "MMM dd, yyyy");

        const products = orderData.orderedItems.map(item => ({
            quantity: item.quantity,
            description: item.product_name,
            price: item.price - item.offerAmount, 
        }));


        const data = {
            apiKey: "free",
            mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
            images: {
                logo: process.env.LOGO_URL,  
            },
            sender: {
                company: "Fein Clothing",
                address: "Calicut, Kerala",
                zip: "337733",
                state: "kerala",
                country: "India",
            },
            client: {
                company: orderData.shippingAddress.name,
                address: orderData.shippingAddress.address,
                zip: orderData.shippingAddress.pincode,
                city: `${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}`,
                country: orderData.shippingAddress.country,
            },
            information: {
                OrderId: orderData.orderId,
                date: formattedDate,
            },
            products,
            settings: {
                currency: "INR",
            },
        };

        const invoiceFolderPath = path.join(__dirname, '../invoices');
        const invoiceFilePath = path.join(invoiceFolderPath, `invoice-${orderData.orderId}.pdf`);

        const result = await easyinvoice.createInvoice(data);
        if (!result || !result.pdf) {
            return res.status(500).json({ message: 'Error generating invoice' });
        }
        await fs.promises.mkdir(invoiceFolderPath, { recursive: true });
        await fs.promises.writeFile(invoiceFilePath, result.pdf, 'base64');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderData.orderId}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(invoiceFilePath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                if (!res.headersSent) res.status(500).json({ message: 'Error sending file' });
            }
        });
    } catch (error) {
        console.error("Error generating invoice:", error.message);
        return res.status(500).json({ message: 'Error generating invoice' });
    }
};

module.exports = {
    generateInvoice,
};