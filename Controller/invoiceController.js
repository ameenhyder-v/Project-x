const Order = require('../Model/orderModel');
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

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
            mode: "development",
            images: {
                logo: "https://i.pinimg.com/originals/ba/6e/01/ba6e015ba478583bd77e2c54c52288d4.png",  
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

        // Creating the invoice
        easyinvoice.createInvoice(data, async function (result) {
            await fs.promises.mkdir(invoiceFolderPath, { recursive: true });
            await fs.promises.writeFile(invoiceFilePath, result.pdf, 'base64');

            res.sendFile(invoiceFilePath, {
                headers: {
                    'Content-Disposition': `attachment; filename="invoice-${orderData.orderId}.pdf"`,
                },
            }, (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    return res.status(500).json({ message: 'Error sending file' });
                }
            });
        });
    } catch (error) {
        console.error("Error generating invoice:", error.message);
        return res.status(500).json({ message: 'Error generating invoice' });
    }
};

module.exports = {
    generateInvoice,
};