const { fail } = require("assert");
const Variant = require("../Model/variantModel")
const Product = require("../Model/productModel")


const addVriant = async (req, res) => {
    try {
        const { colour, size, quantity, price } = req.body;

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
        for (i = 0; i < size.length; i++){
            stock[i] = {
                size: size[i],
                quantity: quantity[i],
                price:  price[i]
            }
        }
        // console.log(stock);

        const images = req.files.map(file => file.filename)

        const {productId} = req.session;

        const isExists = await Variant.findOne({color: colour, productId: productId});

        if (isExists){
            return res.status(200).json({fail: "Variant already exists"});
        }
        const variant = new Variant({
            color:colour,
            productId:productId,
            image:images,
            stock: stock,
        })

        const saving  = await variant.save()
        if (saving) {
            await Product.findOneAndUpdate({ _id: productId }, { isVariant: true, })
            res.status(200).json({success : "success"});

        }else {
            res.status(200).json({fail: "Sorry! Please try again.."})
        }
        // console.log(productId)
    } catch (error) {
        console.log(`error form variantController.addVriant: ${error}`);
    }
}


const loadVariant = async (req, res) => {
    try {

        const {productId} = req.query;
        // console.log(productId);
        const variants = await Variant.find({productId: productId}).populate('productId');
        // console.log(variants);
        // console.log(variants);
        res.render("variant", {variants: variants})
        
    } catch (error) {
        console.log(`error from the variantController.loadVariant: ${error}`)
    }
}


const editVariant = async (req, res) => {
    try {
        const { variantId } = req.query;

        const data = await Variant.findOne({_id: variantId}).populate("productId");
        // console.log(data)
        res.render("editVariant", {data: data});
    } catch (error) {
        console.log(`error from the variantController.editVariant : ${error}`)
    }
}

const chngeColor = async (req,res) => {
    try {
        const {color} = req.query
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    addVriant,
    loadVariant,
    editVariant
}