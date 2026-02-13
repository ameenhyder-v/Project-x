const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const flash = require("express-flash");
require("dotenv").config();
const nocache = require("nocache");

const isProduction = process.env.NODE_ENV === "production";
const mongoUri = isProduction ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV;
const port = parseInt(process.env.PORT, 10) || 7999;
const sessionSecret = (process.env.SESSION_SECRET || "").trim() || (isProduction ? null : "dev-secret-change-in-production");

if (isProduction && !sessionSecret) {
    console.error("Fatal: SESSION_SECRET must be set in production.");
    process.exit(1);
}

const express = require("express");
const app = express();

if (isProduction) {
    app.set("trust proxy", 1);
    const helmet = require("helmet");
    app.use(helmet({ contentSecurityPolicy: false }));
    const compression = require("compression");
    app.use(compression());
}

app.use(nocache());
app.use(express.static(path.join(__dirname, "public/users/assets/")));
app.use(express.static("public/admin"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.set("view engine", "ejs");
app.set("views", "./views/users");

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: isProduction ? { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } : {}
}));

app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (stricter in production)
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: isProduction ? 15 * 60 * 1000 : 1 * 60 * 1000,
    max: isProduction ? 200 : 500,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

const userRoute = require("./routes/userRoute");
const adminRoute = require('./routes/adminRoute')

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use((req, res, next) => {
    res.status(404).render('page_not_found');
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(isProduction ? err.message : err.stack);
    res.status(500).send(isProduction ? "Something went wrong." : "Something broke!");
});

// Log unhandled promise rejections (avoid silent failures in production)
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start server only after MongoDB is connected
mongoose.connect(mongoUri)
    .then(() => {
        if (!isProduction) console.log("MongoDB connected");
        app.listen(port, "0.0.0.0", () => {
            console.log(isProduction ? `Server listening on port ${port}` : `Server: http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });