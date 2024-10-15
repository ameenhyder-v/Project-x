const Product = require("../Model/productModel");
const Category = require("../Model/categoryModel");
const Variant = require("../Model/variantModel");
const Offer = require("../Model/offerModel");
const { parse } = require("dotenv");

const loadOfferPage = async (req, res) => {
    try {

        const perPage = 10; 
        const page = req.query.page || 1; 

        const offerData = await Offer.find()
            .skip((perPage * page) - perPage) 
            .limit(perPage); 

        const totalOffers = await Offer.countDocuments();

        res.render("offer", { offerData, currentPage: parseInt(page, 10), totalPages: Math.ceil(totalOffers / perPage) });
    } catch (error) {
        console.log(`error from the offerController. loadOfferPage fn: ${error.message}`);
    }
};


const fetchAllCategory = async (req, res) => {
    try {
        const categories = await Category.find({ isBlocked: false });
        // console.log(categories)
        res.json(categories); 
    } catch (error) {
        console.log(`error from offer Controller. fetchAllCategory fn : ${error}`)
        res.status(500).json({ message: 'Error fetching categories' });
    }
}


const fetchAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isBlocked: false }).populate('categoryId');
        console.log(products)
        res.json(products); 
    } catch (error) {
        console.log(`error from offer Controller. fetchAllProducts fn : ${error}`)
        res.status(500).json({ message: 'Error fetching products' });
    }
}

const addOffer = async (req, res) => {
    try {
        console.log("Adding offer...");
        const { offerName, dicPercentage, selection, items, itemText } = req.body;

        // Validate offerName
        if (!offerName || offerName.trim() === "") {
            return res.status(400).json({ message: "Offer name cannot be empty or whitespace." });
        }

        // Validate selection
        const validSelections = ["category", "product"];
        if (!validSelections.includes(selection)) {
            return res.status(400).json({ message: "Invalid selection. Must be 'category' or 'product'." });
        }

        // Validate discountPercentage
        const discountPercentage = parseInt(dicPercentage, 10);
        if (isNaN(discountPercentage) || discountPercentage < 5 || discountPercentage > 70) {
            return res.status(400).json({ message: "Discount percentage must be between 5% and 70%." });
        }

        const alreadyExists = await Offer.findOne({ offerName });

        if (alreadyExists) {
            return res.status(400).json({ message: "An offer with this name already exists." });
        }

        const sameOffer = await Offer.findOne({ selectionType: selection, selectedItemId: items });

        if (sameOffer) {
            await Offer.deleteOne({ _id: sameOffer._id });
            // console.log(`Deleted the same offer: ${sameOffer.offerName}`);
        }
        // Create the offer record
        const newOffer = new Offer({
            offerName,
            discountPercentage,
            selectionType: selection,
            selectedItemId: items,
            whichField: itemText
        });

    
        await newOffer.save();
        // console.log("Offer saved successfully.");

        if (selection === "category") {
            // Handling category based offer
            const products = await Product.find({ categoryId: items });
            const productIds = products.map(product => product._id);
            const variants = await Variant.find({ productId: { $in: productIds } });

            const discountMultiplier = discountPercentage / 100;
            const updateOperations = variants.map(variant => {
                const newCategoryOfferPrice = variant.price * (1 - discountMultiplier);
                const newPrice = Math.floor(newCategoryOfferPrice)

                return {
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: { categoryOfferPrice: newPrice } }
                    }
                };
            });

            await Variant.bulkWrite(updateOperations);
            // console.log("Successfully applied the category offer to variants.");

        } else if (selection === "product") {
            // Handling product based offer
            const variants = await Variant.find({ productId: items });
            const discountMultiplier = discountPercentage / 100;
            const updateOperations = variants.map(variant => {
                const newProductOfferPrice = variant.price * (1 - discountMultiplier);
                const newPrice = Math.floor(newProductOfferPrice)

                return {
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: { productOfferPrice: newPrice } }
                    }
                };
            });

            await Variant.bulkWrite(updateOperations);
            // console.log("Successfully applied the product offer to variants.");
        }

        res.status(200).json({ success: true, message: "Offer added successfully." });

    } catch (error) {
        console.log(`Error from the offerController. addOffer: ${error}`);
        res.status(500).json({ message: "Internal server error." });
    }
};


const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.query;

        // Find the offer by ID
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found." });
        }

        const { selectionType, selectedItemId, discountPercentage } = offer;

        // Reverting offer based on its type (category or product)
        const discountMultiplier = discountPercentage / 100;

        if (selectionType === "category") {
            // Handling category-based offer removal
            const products = await Product.find({ categoryId: selectedItemId });
            const productIds = products.map(product => product._id);
            const variants = await Variant.find({ productId: { $in: productIds } });

            const revertOperations = variants.map(variant => {
                return {
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: { categoryOfferPrice: null } } // Revert category offer price
                    }
                };
            });

            await Variant.bulkWrite(revertOperations);
            // console.log("Successfully reverted the category offer from variants.");

        } else if (selectionType === "product") {
            // Handling product-based offer removal
            const variants = await Variant.find({ productId: selectedItemId });

            const revertOperations = variants.map(variant => {
                return {
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: { productOfferPrice: null } } // Revert product offer price
                    }
                };
            });

            await Variant.bulkWrite(revertOperations);
            // console.log("Successfully reverted the product offer from variants.");
        }

        // Delete the offer after reverting the prices
        await Offer.findByIdAndDelete(offerId);

        res.status(200).json({ success: true, message: "Offer deleted and prices reverted successfully." });

    } catch (error) {
        console.log(`Error from the offerController. deleteOffer: ${error}`);
        res.status(500).json({ message: "Internal server error." });
    }
};


module.exports = {
    loadOfferPage,
    fetchAllCategory,
    fetchAllProducts,
    addOffer,
    deleteOffer
}