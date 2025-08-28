const mongoose = require("mongoose");
const path = require("path")
const session = require("express-session")
const flash = require("express-flash")
require("dotenv").config();
const nocache = require("nocache");

mongoose.connect("mongodb://127.0.0.1:27017/myStore")
    .then(()=> console.log("mongodb worked"))
    .catch(error => console.log("mongo connect error: ", error));

// const uri = process.env.MONGO_URI;

// mongoose.connect(uri)
//     .then(() => {
//         console.log('MongoDB connection established successfully');
//     })
//     .catch((err) => {
//         console.error('Error connecting to MongoDB:', err.message);
//     });


const express = require("express");
const app = express();

app.use(nocache());

app.use(express.static(path.join(__dirname, "public/users/assets/")));
// app.use(express.static("public/users"));
app.use(express.static("public/admin"));
app.use("/images", express.static(path.join(__dirname, "images")))

app.set("view engine", "ejs");

app.set("views", "./views/users")


app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false
}))

app.use(flash())

app.use(express.json())
app.use(express.urlencoded({ extended: true}))



const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use((req, res, next) => {
    res.status(404).render('page_not_found');
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});



app.listen(7999,() =>{
    console.log("server is running on : http://localhost:7999")
})