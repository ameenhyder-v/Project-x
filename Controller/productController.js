const Product = require("../Model/productModel");
const categoryController = require("../Controller/categoryController");

const productExists = async function(productName, gender,category) {
    const prod = await Product.findOne({ name: productName, gender: gender, category: category })
    console.log(prod);
    return prod
}

const addingProduct = async (req, res) => {
    try {
        const { productName, description, brandName, material, category, tags, gender} = req.body;


        if (!productName || typeof productName !== 'string') {
            return res.status(400).json({"message": 'Name is required and should be a string!'});
        }
        if (!description) {
            return res.status(400).json({"message": 'Description is required!'});
        }
        if (!brandName || typeof brandName !== 'string') {
            return res.status(400).json({"message": 'Brand name is required and should be a string!'});
        }
        if (!category || typeof category !== 'string') {
            return res.status(400).json({"message": "Category is required and should be a string!"});
        }
        if (!category || typeof category !== 'string') {
            return res.status(400).json({ "message": "Pleas select a Sub-category!" });
        }
        if (!gender || typeof gender !== 'string') {
            return res.status(400).json({ "message": "Please select a gender!" });
        }
        if (!tags || typeof tags !== 'string') {
            return res.status(400).json({ "message": "Tags must be an string!" }) 
        }
        

        const categoryId = await categoryController.getingId(gender, category);

        if (!categoryId) {
            return res.status(400).json({ "message": "cannot find the category" })
        } 

        const checkProductExists = await productExists(productName, gender, category)
        console.log(checkProductExists);
        if(checkProductExists){
            return res.status(400).json({"message": "this product already exists add variant"});
        }else{
            // console.log(`productName: ${productName}  desc: ${description}  brand ${brandName}  category: ${category}  tags: ${tags}, `)
            const addProduct = new Product({
                name: productName,
                description: description,
                categoryId: categoryId,
                brand: brandName,
                material: material,
                gender: gender,
                category: category
            })
            //response
            const saving = await addProduct.save()
            const productId = saving._id
            req.session.productId = productId;

            return res.status(200).json({success: "product addedd" })
        }
        
    } catch (error) {
        console.log(`error from the productController.addingProduct : ${error.message}`)
    }
}

const removeProductVariantFalse = async () => {
    const removeProduct = await Product.deleteMany({isVariant: false})
    if (removeProduct){
        console.log("success")
    }else{
        console.log("not working");
    }
}

const blockProduct = async (req, res) => {
    try {
        const productId = req.query.id
        const product = await Product.findOne({ _id: productId })
        if (product) {
            product.isBlocked = !product.isBlocked
            const update = await product.save()
            // console.log(`${product.name}'s status changed to  : ${product.isBlocked}`);
            res.send({ success: true })
        } else {
            console.log("product id not found to block or unblock")
            res.send({ success: false })
        }
    } catch (error) {
        console.log("Error in block Product", error.message)
    }
}

// const haveVariant = async function(Product_id)

module.exports = {
    addingProduct,
    productExists,
    removeProductVariantFalse,
    blockProduct
}


// data-bs-toggle="modal" data-bs-target="#variantModal"