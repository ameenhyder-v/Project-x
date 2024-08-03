const Product = require("../Model/productModel");
const categoryController = require("../Controller/categoryController");
const Variant = require("../Model/variantModel")

const productExists = async function(productName, gender,category) {
    const prod = await Product.findOne({ name: productName, gender: gender, category: category })
    // console.log(prod);
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
                category: category,
                tags: tags
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
        // console.log("success")
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


//? GETTING THE PRODUCT DATA FOR EDITING
const editThisProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        const product = await Product.findById(productId);
        res.status(200).json({ data: product });
        console.log(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product data' });
        console.error('Error fetching product data:', error);
    }
};


//? UPDATING AFTER EDITING
const updateProduct = async (req, res) => {
    try {

        
        const { productId, productName, description, brandName, material, category, tags, gender } = req.body;

        // console.log(productId, "---", productName, "---------", description, "\n", brandName, "=======    ",material, " --------- ",category,  "=====", tags, "------   ", gender)

        if (!productName || typeof productName !== 'string' || productName.trim().length <= 4 ) {
            return res.status(400).json({ "message": 'Name is required and should be a string of at least 5 characters!' });
        }
        if (!description) {
            return res.status(400).json({ "message": 'Description is required!' });
        }
        if (!brandName || typeof brandName !== 'string' || brandName.trim().length <= 2) {
            return res.status(400).json({ "message": 'Brand name is required and should be a string of at least 3 characters!' });
        }
        if (!material || typeof material !== 'string') {
            return res.status(400).json({ "message": "Category is required and should be a string!" });
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
        if (checkProductExists) {
            return res.status(400).json({ "message": "No changes made! or smae product in the same category exists " });
        }
        
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(400).json({ message: 'Product not found!' });
        }

        product.name = productName;
        product.description = description;
        product.brand = brandName;
        product.material = material;
        product.categoryId = categoryId;
        product.tags = tags;
        product.gender = gender;

        const save = await product.save();
        if (save){
            console.log("success!")
            res.status(200).json({ message: 'product updated properly'})
        }

    } catch (error) {
        console.log(`error from the product controller updateProduct - ${error}`)
    }
}

//?DELETE PRODUCET 
//TODO ALSO DELETING ALL VARIANTS FROM THAT PRODUCT
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.query;

        const deleteThisProduct = await Product.findByIdAndDelete(productId);

        if (!deleteThisProduct) {
            return res.status(404).json({ message: 'Product not found!' });
        }

        const deleteVariant = await Variant.deleteMany({ productId });
        if(deleteVariant){
            return res.status(200).json({ message: 'Product and its variants deleted successfully!' });
        }

    } catch (error) {
        console.log(`Error from the product controller delete product - ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//? FRONTEND SORTING PRODUCT DATA USER SIDE

    const sort = async (req, res) => {
        try {

                const value = req.body.value;
                console.log(typeof value);

                let sortOrder;
                if (value === "highToLow") {
                    sortOrder = -1; // High to low
                } else if (value === "lowToHigh") {
                    sortOrder = 1; // Low to high
                } else {
                    // Handle invalid or unspecified sort values
                    return res.status(400).json({
                        success: false,
                        message: "Invalid sort value"
                    });
                }

                const products = await Variant.aggregate([
                    { $unwind: "$stock" },
                    { $sort: { "stock.price": sortOrder } }, // Sort by the price of each stock item based on sortOrder
                    {
                        $group: {
                            _id: "$_id",
                            color: { $first: "$color" },
                            productId: { $first: "$productId" },
                            image: { $first: "$image" },
                            stock: { $push: "$stock" },
                            isListed: { $first: "$isListed" },
                            addedAt: { $first: "$addedAt" }
                        }
                    },
                    { $sort: { "stock.0.price": sortOrder } } // Sort by the price of the first stock item based on sortOrder
                ]);

                const populatedProducts = await Variant.populate(products, { path: 'productId' });

                res.status(200).json({
                    success: true,
                    data: populatedProducts
                });

        } catch (error) {
            console.log("error from product controller sort function  -- ", error )
        }
        
    }

const AlphaSort = async (req, res) => {
    try {
        const value = req.body.value;
        console.log(typeof value);

        let sortOrder;
        if (value === "nameAZ") {
            sortOrder = 1;
        } else if (value === "nameZA") {
            sortOrder = -1;
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid sort value"
            });
        }

        const products = await Variant.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: "$product" },
            {
                $sort: { "product.name": sortOrder } // Sort by the product name
            },
            {
                $project: {
                    _id: 1,
                    color: 1,
                    productId: 1,
                    image: 1,
                    stock: 1,
                    isListed: 1,
                    addedAt: 1,
                    product: {
                        name: 1
                    }
                }
            }
        ]);

        const populatedProducts = await Variant.populate(products, { path: 'productId' });

        console.log(populatedProducts);
        res.status(200).json({
            success: true,
            data: populatedProducts
        });

    } catch (error) {
        console.log("Error from product controller sort function -- ", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


module.exports = {
    addingProduct,
    productExists,
    editThisProduct,
    removeProductVariantFalse,
    blockProduct,
    sort,
    AlphaSort,
    updateProduct,
    deleteProduct
}


// data-bs-toggle="modal" data-bs-target="#variantModal"