const Variant = require("../Model/variantModel")

const checkVariant = async function(){

}

const addVriant = async (req, res) => {
    try {
        console.log('this is geting here');
        console.log(req.files);
        const { colour, size, quantity, price } = req.body;
        console.log(size)
        const stock = [];
        for (i = 0; i < size.length; i++){
            stock[i] = {
                size: size[i],
                quantity: quantity[i],
                price:  price[i]
            }
        }
        console.log(stock);
        const images = req.files.map(file => file.filename)
        const {productId} = req.session;
        const variant = new Variant({
            color:colour,
            productId:productId,
            image:images,
            stock: stock,
        })

        const saving  = await variant.save()
        console.log(productId)
    } catch (error) {
        console.log(`error form variantController.addVriant: ${error}`);
    }
}

module.exports = {
    addVriant
}