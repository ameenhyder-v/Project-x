const Cart = require("../Model/cartModel");
const Variant = require("../Model/variantModel")
const { path } = require("../routes/adminRoute");

const addToCart = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;
        // const quantity = 1;
        let userCart = await Cart.findOne({ userId });
        const variant = await Variant.findById(variantId)
        const stockItem = variant.stock.find(item => item.size === size.trim());
        if (stockItem.quantity <= 0){
            return res.status(200).json()
        }
        
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
                return res.status(200).json({fail: "Item already in cart"})
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
        const cartData = await Cart.findOne({ userId }).populate("cartItems.variantId");

        if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
            return 0;
        }

        const total = cartData.cartItems.reduce((acc, item) => {
            const variant = item.variantId;
            if (variant) {
                const stockItem = variant.stock.find(stock => stock.size.trim() === item.size.trim());
                if (stockItem && stockItem.quantity >= item.quantity) {
                    const lowestPrice = Math.min(
                        variant.categoryOfferPrice || variant.price,
                        variant.productOfferPrice || variant.price,
                        variant.price
                    );
                    acc += lowestPrice * item.quantity; 
                }
            }
            return acc;
        }, 0);

        return total;
    } catch (error) {
        console.error("Error calculating subtotal:", error);
        return 0;
    }
}




//! CART LOADING

const shopingCart = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(400).json({ error: "User not found" });
        }

        const cartData = await Cart.findOne({ userId }).populate({
            path: "cartItems.variantId",
            populate: {
                path: "productId",
                model: "Product"
            }
        });

        if (!cartData || !cartData.cartItems.length) {
            return res.render("shopping-cart", { cartData: { cartItems: [] }, subTotalAmount: 0, message: "Your cart is empty." });
        }

        cartData.cartItems.forEach(item => {
            const size = item.size.trim();
            const variant = item.variantId;
            const product = item.variantId.productId;
        });

        const subTotalAmount = await subTotal(userId);

        res.render("shopping-cart", { cartData, subTotalAmount });

    } catch (error) {
        console.error(`Error from shopping cart: ${error}`);
        return res.status(500).json({ error: "An error occurred while fetching the shopping cart" });
    }
};


//? ADDING QUNTITY FROM CART PAGE
const addQuantity = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId;
        const variant = await Variant.findOne({_id: variantId})
        const stock = variant.stock.find(item => item.size.trim() == size.trim());

        if (!userId) {
            return res.status(200).json({ fail: "User not authenticated" });
        }
        const userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            return res.status(404).json({ fail: "Cart not found" });
        }

        const cartItem = userCart.cartItems.find(item =>
            item.variantId == variantId && item.size.trim() == size.trim()
        );

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
                const lowestPrice = Math.min(
                    variant.categoryOfferPrice || variant.price,
                    variant.productOfferPrice || variant.price,
                    variant.price
                );
                let total = cartItem.quantity * lowestPrice;
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
                const lowestPrice = Math.min(
                    variant.categoryOfferPrice || variant.price,
                    variant.productOfferPrice || variant.price,
                    variant.price
                );
                let total = cartItem.quantity * lowestPrice;
                res.status(200).json({ success: 1, quantity: cartItem.quantity, totalPrice: total, subTotalAmount: subTotalAmount });
            }
            
        } else {
            res.status(200).json({ message: "Must need one quantity" })
        }

    } catch (error) {
        console.log(`error from the cart controller. addQuantity:  ${error}`)
    }
}

const removeItem = async (req, res) => {
    try {
        const { variantId, size } = req.body;
        const userId = req.session.userId ;

        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ error: "Cart not found." });
        }

        const itemIndex = cart.cartItems.findIndex(item =>
            item.variantId.toString() === variantId && item.size.trim() === size
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart." });
        }

        cart.cartItems.splice(itemIndex, 1);
        await cart.save();

        res.status(200).json({ success: "Item removed from cart." });        
    } catch (error) {
        console.log(`error from the cart controller removeItem :  ${error.message}`)
    }
}

const cartItemCount = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId });
        const cartItemCount = cart ? cart.cartItems.length : 0;
        return cartItemCount;
    } catch (error) {
        console.log(`error in the cart controller cartItemCount: ${error.message}`)
        
    }
}



module.exports = {
    addToCart,
    shopingCart,
    addQuantity,
    decreaseQuantity,
    subTotal,
    removeItem,
    cartItemCount
}