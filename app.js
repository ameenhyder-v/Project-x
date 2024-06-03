const mongoose = require("mongoose");
const path = require("path")
const session = require("express-session")
const flash = require("express-flash")
require("dotenv").config();

mongoose.connect("mongodb://127.0.0.1:27017/myStore");

const express = require("express");
const app = express();



app.use(express.static(path.join(__dirname, "public/users/assets/")));
// app.use(express.static("public/users"));
app.use(express.static("public/admin"));


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



app.listen(7999,() =>{
    console.log("server is running on : http://localhost:7999")
})