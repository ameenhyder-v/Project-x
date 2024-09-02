const { fail } = require("assert");
const Variant = require("../Model/variantModel")
const Product = require("../Model/productModel");
const { query } = require("express");
const mongoose = require('mongoose');
const { findById } = require("../Model/userModel");
const fs = require("fs").promises;


//! ADMIN ADDING VARIANT
const addVariant = async (req, res) => {
    try {
        const { colour, size, quantity, price } = req.body;
        // console.log(size);

        // if (typeof colour !== 'string' || colour.trim() === '') {
        //     return res.status(200).json({ fail: "Color must be a non-empty string" });
        // }

        // if (typeof size !== 'string' || size.length !== 1) {
        //     return res.status(200).json({ fail: "Size must be a single character" });
        // }

        // if (isNaN(quantity) || quantity <= 0) {
        //     return res.status(200).json({ fail: "Quantity must be a positive number" });
        // }

        // if (isNaN(price) || price <= 0) {
        //     return res.status(200).json({ fail: "Price must be a positive number" });
        // }


        const stock = [];
        for (i = 0; i < size.length; i++) {
            stock[i] = {
                size: size[i],
                quantity: quantity[i],
                price: price[i]
            }
        }
        // console.log(stock);

        const images = req.files.map(file => file.filename)

        const { productId } = req.session;

        const isExists = await Variant.findOne({ color: colour, productId: productId });

        if (isExists) {
            return res.status(200).json({ fail: "Variant already exists" });
        }
        const variant = new Variant({
            color: colour,
            productId: productId,
            image: images,
            stock: stock,
        })

        const saving = await variant.save()
        if (saving) {
            await Product.findOneAndUpdate({ _id: productId }, { isVariant: true, })
            res.status(200).json({ success: "success" });

        } else {
            res.status(200).json({ fail: "Sorry! Please try again.." })
        }
        console.log(productId)
    } catch (error) {
        console.log(`error form variantController.addVriant: ${error}`);
    }
}

//!LOADING VARIANT PAGE
const loadAllVariant = async (req, res) => {
    try {

        const { productId } = req.query;
        // console.log(productId);
        const variants = await Variant.find({ productId: productId }).populate('productId');
        // console.log(variants);
        // console.log(variants);
        res.render("variant", { variants: variants, productId: productId })

    } catch (error) {
        console.log(`error from the variantController.loadVariant: ${error}`)
    }
}

//! LOAD NEW VARIANT ADDING PAGE
const loadAddNewVariant = async (req, res) => {
    try {
        const { productId } = req.query;
        // console.log(productId)
        res.render("add-variant", { productId })
        
    } catch (error) {
        console.log(`error form the variant controller load add new variant : ${error}`)
    }
}


//! ADDNIG NEW VARIANT FOR A ALREDY EXISTING PRODUCT 

const addNewVariant = async (req, res) => {
    try {
        const { colour, size, quantity, price } = req.body;

        if (typeof colour !== 'string' || colour.trim() === '') {
            return res.status(200).json({ fail: "Color must be a non-empty string" });
        }

        if (!Array.isArray(size) || !Array.isArray(quantity) || !Array.isArray(price)) {
            return res.status(200).json({ fail: "Size, quantity, and price must be arrays" });
        }

        if (size.length !== quantity.length || size.length !== price.length) {
            return res.status(200).json({ fail: "Size, quantity, and price arrays must have the same length" });
        }

        const stock = [];
        for (i = 0; i < size.length; i++) {
            stock[i] = {
                size: size[i],
                quantity: quantity[i],
                price: price[i]
            }
        }
        console.log(stock)
        

        const images = req.files.map(file => file.filename);

        let { productId } = req.query;

        productId = productId.replace(/['"]+/g, '').trim();
        console.log(productId)

        const isExists = await Variant.findOne({ color: colour, productId: productId });

        if (isExists) {
            return res.status(200).json({ fail: "Variant already exists" });
        }

        const variant = new Variant({
            color: colour,
            productId: productId,
            image: images,
            stock: stock,
        })

        const saving = await variant.save();
        if (saving) {
            await Product.findOneAndUpdate({ _id: productId }, { isVariant: true });
            return res.status(200).json({ success: "Variant added successfully" , productId});
        } else {
            return res.status(200).json({ fail: "Failed to save variant. Please try again." });
        }

    } catch (error) {
        console.error(`Error in variantController.addNewVariant: ${error}`);
        return res.status(500).json({ fail: "An error occurred. Please try again later." });
    }
};





//! DELETE A SINGLE VARIANT IT WILL GONE FOR EVER 
const deleteVariant = async (req, res) => {
    try {
        const { vId } = req.query;

        const variant = await Variant.findById(vId);
        if (!variant) {
            return res.status(200).json({ success: false, message: 'Variant not found.' });
        }

        const productId = variant.productId;
        const allVariants = await Variant.find({ productId: productId });

        if (allVariants.length === 1) {
            return res.status(200).json({ success: false, message: "Cannot delete the only variant of the product. Insted delete the product" });
        }

        // Delete the variant
        const deleteThisVariant = await Variant.findByIdAndDelete(vId);
        if (!deleteThisVariant) {
            return res.status(200).json({ success: false, message: 'Failed to delete the variant.' });
        }

        return res.status(200).json({ success: true, message: 'Variant successfully deleted.' });

    } catch (error) {
        console.log(`Error from the variant controller deleteVariant function: ${error}`);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the variant.' });
    }
}

//! LOAD EDIT VARIANT PAGE
const editVariant = async (req, res) => {
    try {
        const { variantId } = req.query;

        const data = await Variant.findOne({ _id: variantId }).populate("productId");
        res.render("editVariant", { data: data });
    } catch (error) {
        console.log(`error from the variantController.editVariant : ${error}`)
    }
}


//! UPDATING VARIANT 
const updateVariant = async (req, res) => {
    try {
        const { colour, size, quantity, price } = req.body;
        const { variantId } = req.query;

        // Validate that size, quantity, and price are provided and are arrays
        if (!Array.isArray(size) || !Array.isArray(quantity) || !Array.isArray(price)) {
            return res.status(200).json({ fail: "Size, quantity, and price must be arrays." });
        }

        // Validate that size, quantity, and price arrays have the same length
        if (size.length !== quantity.length || size.length !== price.length) {
            return res.status(200).json({ fail: "Size, quantity, and price arrays must have the same length." });
        }

        // Validate that quantity and price are positive numbers
        for (let i = 0; i < size.length; i++) {
            if (quantity[i] <= 0) {
                return res.status(200).json({ fail: `Quantity at size ${size[i]} must be a positive number.` });
            }
            if (price[i] <= 0) {
                return res.status(200).json({ fail: `Price at size ${size[i]} must be a positive number.` });
            }
        }

        //? STOCK CREATING FOR SAVING ARRAY OF OBJECTS
        const stock = size.map((s, i) => ({
            size: s,
            quantity: quantity[i],
            price: price[i],
        }));

        // Find the variant by ID
        const findVariant = await Variant.findOne({ _id: variantId });
        if (!findVariant) {
            return res.status(200).json({ fail: "Variant not found." });
        }

        // Update the variant's color and stock
        findVariant.color = colour;
        findVariant.stock = stock;

        if (req.files && req.files.length > 0) {
            req.files.forEach(item => {
                if (item.fieldname === 'Image0') {
                    fs.unlink(`images/${ findVariant.image[0]}`);
                    findVariant.image[0] = item.filename
                } else if (item.fieldname === 'Image1') {
                    fs.unlink(`images/${findVariant.image[1]}`);
                    findVariant.image[1] = item.filename
                } else if (item.fieldname === 'Image2') {
                    fs.unlink(`images/${findVariant.image[2]}`);
                    findVariant.image[2] = item.filename
                } else {
                    fs.unlink(`images/${findVariant.image[3]}`);
                    findVariant.image[3] = item.filename
                }
            });
        }


        // Save the updated variant
        const saveVariant = await findVariant.save();
        if (saveVariant) {
            const productId = saveVariant.productId;
            res.status(200).json({ success: "Variant updated successfully", productId: productId });
        } else {
            res.status(500).json({ error: "Failed to update variant." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while updating the variant." });
    }
};



module.exports = {
    addVariant,
    loadAllVariant,
    editVariant,
    updateVariant,
    loadAddNewVariant,
    addNewVariant,
    deleteVariant
}