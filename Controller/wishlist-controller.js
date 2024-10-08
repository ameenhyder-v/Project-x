const Wishlist = require("../Model/wishlist-model");

const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login"); 
        }

        const wishlistData = await Wishlist.findOne({ userId })
            .populate({
                path: 'wishlistItems',
                populate: {
                    path: 'productId',
                    populate: {
                        path: 'categoryId',
                    }
                }
            })
            .exec();

        if (!wishlistData || !wishlistData.wishlistItems) {
            return res.render("wish-list", { variants: [], message: "Your wishlist is empty." });  
        }

        res.render("wish-list", { variants: wishlistData.wishlistItems });

    } catch (error) {
        console.log(`error from the wishlist controller load wishlist - ${error.message}`);
        res.status(500).send("Internal server error");
    }
};


const findUsersWishlistItems = async (userId) => {
    const wishListData = await Wishlist.findOne({userId: userId})
    return wishListData;
}

const addToWishlist = async (req, res) => {
    try {
        const { variantId } = req.body;
        const userId = req.session.userId;

        if (!variantId || !userId) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, wishlistItems: [variantId] });
        } else if (wishlist.wishlistItems.includes(variantId)) {
            return res.json({
                success: false,
                message: "This item is already in your wishlist. Do you want to remove it?",
                exists: true
            });
        } else {
            wishlist.wishlistItems.push(variantId);
        }

        const save = await wishlist.save();
        if(save){
           return res.json({ success: true, message: 'Item added to wishlist' });
        }

    } catch (error) {
        console.error(`Error in addToWishlist: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const removeWishItem = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { variantId } = req.body;

        if (!variantId || !userId) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }
        const index = wishlist.wishlistItems.indexOf(variantId);

        if (index > -1) {
            wishlist.wishlistItems.splice(index, 1);
            await wishlist.save();
            return res.json({ success: true, message: 'Item removed from wishlist' });
        } else {
            return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
        }

    } catch (error) {
        console.log(`error in the wishlist controller removeWishItem: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports = {
    loadWishlist,
    addToWishlist,
    findUsersWishlistItems,
    removeWishItem
}