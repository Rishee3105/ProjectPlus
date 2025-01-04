import express from "express";
import { registerUser } from "../controllers/userController.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);


export default userRoute;
