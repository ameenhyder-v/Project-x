const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: "images",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueFilename = `image_${getRandomThreeDigitNumber()}_${Date.now()}${ext}`
        cb(null, uniqueFilename);
    }
})

function getRandomThreeDigitNumber() {
    return Math.floor(Math.random() * 900) + 100;
}
const upload = multer({storage: storage});
module.exports = upload;