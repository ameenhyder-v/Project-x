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

const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, and PNG files are allowed."), false);
    }
};


const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max per file
}); 

module.exports = upload;