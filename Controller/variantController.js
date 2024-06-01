const Variant = require("../Model/variant")

const checkVariant = async function(){

}

const addVriant = async (req, res) => {
    try {
        console.log('this is geting here');
        console.log(req.body);
        const { colour, size, quantity, price } = req.body;
    
        req.files.map()

        console.log(size);
        console.log(image);
    } catch (error) {
        console.log('error form variant controller while adding it ' + error.message);
    }
}

module.exports = {
    addVriant
}