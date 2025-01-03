const express=require("express");
const { registerUser } = require("../controllers/userController");
const userRoute=express();

userRoute.post("/register",registerUser);

module.exports=userRoute;