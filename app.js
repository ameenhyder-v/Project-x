const mongoose = require("mongoose");
const path = require("path")

mongoose.connect("mongodb://127.0.0.1:27017/project-x");

const express = require("express");
const app = express();
const userRoute = require('./routes/userRoute')

app.use("/", userRoute)
app.use(express.static(path.join(__dirname, "public")))

app.listen(7999,() =>{
    console.log("server is running on : http://localhost:7999")
})