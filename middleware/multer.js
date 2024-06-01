const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: "images",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueFilename = `image_${Date.now()}${ext}`
        cb(null, uniqueFilename);
    }
})

const upload = multer({storage: storage});
module.exports = upload;