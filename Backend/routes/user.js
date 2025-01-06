import express from "express";
import { signinUser, registerUser } from "../controllers/userController.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);

userRoute.post("/signin", signinUser);

export default userRoute;
