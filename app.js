const mongoose = require("mongoose");
const path = require("path")

mongoose.connect("mongodb://127.0.0.1:27017/project-x");

const express = require("express");
const app = express();
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

app.use("/", userRoute);
app.use("/admin", adminRoute);
//app.use(express.static(path.join(__dirname, "public/users/assets/")));
app.use(express.static("public/users"));
app.use(express.static("public/admin"));

app.listen(7999,() =>{
    console.log("server is running on : http://localhost:7999")
})