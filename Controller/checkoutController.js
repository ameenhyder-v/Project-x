const Address = require("../Model/addressModel");
const Cart = require("../Model/cartModel");
const cartContoller = require("../Controller/cartController");
const Variant = require("../Model/variantModel");
const Order = require("../Model/orderModel");


//? LOAD CHECK OUT PAGE 
const checkOut = async (req, res) => {
    try {
        const userId = req.session.userId;

        const totalAmount = await cartContoller.subTotal(userId);

        const cartData = await Cart.findOne({ userId: userId }).populate({
            path: 'cartItems.variantId',
            populate: {
                path: 'productId',
                model: 'Product'
            }
        });

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return res.render("checkOut", { addresses: [], cartItems: [], totalAmount: 0, message: "Your cart is empty." });
        }

        const availableCartItems = cartData.cartItems.filter(item => {
            const variant = item.variantId;
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            return stockItem && stockItem.quantity >= item.quantity;
        });

        const addresses = await Address.find({ userId: userId });
        // console.log(availableCartItems)

        res.render("checkOut", { addresses, cartItems: availableCartItems, totalAmount });
    } catch (error) {
        console.error(`Error from the cart controller checkout function: ${error}`);
        res.status(500).send("An error occurred while processing your request.");
    }
}

//? PLACING THE OREDER WITH COD
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.body;

        // Check if userId and addressId are provided
        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const cartData = await Cart.findOne({ userId: userId }).populate({
            path: 'cartItems.variantId',
            populate: {
                path: 'productId',
                model: 'Product'
            }
        });

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return res.render("checkOut", { addresses: [], cartItems: [], totalAmount: 0, message: "Your cart is empty." });
        }

        const availableCartItems = cartData.cartItems.filter(item => {
            const variant = item.variantId;
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            return stockItem && stockItem.quantity >= item.quantity;
        });

        if (availableCartItems.length === 0) {
            return res.status(400).json({ message: 'Some items in your cart are out of stock' });
        }

        const totalAmount = await cartContoller.subTotal(userId);
        
        // Retrieve shipping address
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ message: 'Invalid address ID' });
        }

        // Create ordered items array
        const orderedItems = availableCartItems.map(item => {
            const variant = item.variantId;
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());
            const product = variant.productId;

            return {
                variantId: variant,
                product_name: product.name,
                quantity: item.quantity,
                price: stockItem.price,
                type: product.material,
                category: product.category,
                color: variant.color,
                size: item.size,
            };
        });

        // Create an order
        const order = new Order({
            userId,
            orderedItems,
            shippingAddress: {
                name: address.name,
                address: address.address,
                country: address.country,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                mobile: address.mobile
            },
            totalAmount: totalAmount,
            paymentMethod: 'COD'
        });

        await order.save();
        console.log(order)

        const orderId = order._id;

        // Reduce stock and update variants
        for (const item of availableCartItems) {
            const variant = await Variant.findById(item.variantId._id);
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            if (stockItem) {
                stockItem.quantity -= item.quantity;
            }

            const saveVariant = await variant.save();
            if (saveVariant){
                console.log("variant updated ")
            }else {
                console.log("variant updation faild")
            }
        }

        // Clear the cart
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { cartItems: [] } });

        res.status(200).json({ message: 'Order placed successfully', orderId});

    } catch (error) {
        console.error("Error in placeOrder:", error);
        res.status(500).json({ message: 'An error occurred while placing the order', error: error.message });
    }
}






module.exports = {
    checkOut,
    placeOrder,
}



    // .then(response => {
    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }
    //     return response.json();
    // })
    // .then(data => {
    //     console.log('Success:', data);
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    // });