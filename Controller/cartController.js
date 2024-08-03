const Cart = require("../Model/cartModel");
const Variant = require("../Model/variantModel")
const { path } = require("../routes/adminRoute");

const addToCart = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;
        // const quantity = 1;
        let userCart = await Cart.findOne({ userId });
        
        if (!userCart) {
            if (!userId) {
                res.status(400)
            }
            userCart = new Cart({
                userId,
                cartItems: [{ variantId: variantId, size: size }]
                
            });
        } else {
            const existingItem = userCart.cartItems.find(item => item.variantId.equals(variantId) && item.size == size);
            if (existingItem) {
                return res.status(200).json({fail: "Item alredy in cart"})
            } else {
                userCart.cartItems.push({ variantId, size });
            }
        }
        const saving = await userCart.save();
        if ( saving ){
            return res.status(200).json({ success: "added" })
        }

    } catch (error) {
        console.log(`error from the cart Controller. addToCart:  ${error}`)
    }
}


//! CALCULATING SUBTOTAL AMOUNT OF A USERS CART

async function subTotal(userId) {
    try {
        const cartData = await Cart.findOne({ userId: userId }).populate("cartItems.variantId");

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return 0; 
        }

        const total = cartData.cartItems.reduce((acc, item) => {
            const variant = item.variantId;
            const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());

            if (stockItem && stockItem.quantity > 0) {
                acc += stockItem.price * item.quantity;
            }

            return acc;
        }, 0);

        return total;
    } catch (error) {
        console.error("Error calculating subtotal:", error);
    }
}


//! CART LOADING

const shopingCart = async (req, res) => {
    try {
        const userId = req.session.userId;

        const cartData = await Cart.findOne({ userId }).populate({
            path: "cartItems.variantId",
            populate: {
                path: "productId",
                model: "Product"
            }
        });

       cartData.cartItems.forEach(item=>{
            //console.log(item.variantId);
            const cart = item
            const size = item.size.trim()
            const variant = item.variantId
            const product = item.variantId.productId
    
        })
        const subTotalAmount = await subTotal(userId)

        
        res.render("shoping-cart", { cartData, subTotalAmount })
    } catch (error) {
        console.log(`error from shoping cart: ${error}`)
    }
}


//? ADDING QUNTITY FROM CART PAGE
const addQuantity = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;
        const variant = await Variant.findOne({_id: variantId})
        const stock = variant.stock.find(item => item.size.trim() == size.trim());
        // console.log(stock);

        if (!userId) {
            return res.status(200).json({ fail: "User not authenticated" });
        }

        // console.log("variantId:", variantId);
        // console.log("size:", size);

        const userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            return res.status(404).json({ fail: "Cart not found" });
        }

        const cartItem = userCart.cartItems.find(item =>
            item.variantId == variantId && item.size.trim() == size.trim()
        );

        // console.log(cartItem.quantity)
        // console.log(stock.quantity)

        if (!cartItem) {
            return res.status(200).json({ fail: "Cart item not found" });   
        }
        if (stock.quantity <= cartItem.quantity) {

            return res.status(200).json({ message: "Insufficient stock" })
        }else if (cartItem.quantity >= 5){
            res.status(200).json({ message: "Maximum limit reached"})
        }else  {
            cartItem.quantity += 1;
            const saving = await userCart.save();
            if (saving) {
                let subTotalAmount = await subTotal(userId);
                console.log(subTotalAmount);
                let total = cartItem.quantity*stock.price
                res.status(200).json({ success: 1, quantity: cartItem.quantity, totalPrice: total, subTotalAmount: subTotalAmount });
            }
        }

    } catch (error) {
        console.log(`error from the cart controller. addQuantity:  ${error}`)
    }
}



//? DECREASING QUANTITY FROM CART PAGE
const decreaseQuantity = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;
        const variant = await Variant.findOne({ _id: variantId })
        const stock = variant.stock.find(item => item.size.trim() == size.trim());
        console.log(stock);

        if (!userId) {
            return res.status(200).json({ fail: "User not authenticated" });
        }

        const userCart = await Cart.findOne({ userId: userId });

        const cartItem = userCart.cartItems.find(item =>
            item.variantId == variantId && item.size.trim() == size.trim()
        );

        if (!cartItem) {
            return res.status(200).json({ fail: "Cart item not found" });
        }
        if (cartItem.quantity !== 1) {
            cartItem.quantity -= 1;
            const saving = await userCart.save();
            if (saving) {
                
                let subTotalAmount = await subTotal(userId);
                let total = cartItem.quantity * stock.price
                res.status(200).json({ success: 1, quantity: cartItem.quantity, totalPrice: total, subTotalAmount: subTotalAmount });
            }
            
        } else {
            res.status(200).json({ message: "Must need one quantity" })
        }

    } catch (error) {
        console.log(`error from the cart controller. addQuantity:  ${error}`)
    }
}





module.exports = {
    addToCart,
    shopingCart,
    addQuantity,
    decreaseQuantity,
    subTotal
}