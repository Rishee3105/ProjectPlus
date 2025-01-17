import express from "express";
import { signinUser, registerUser } from "../controllers/userController.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.post("/signin", signinUser);
userRoute.get("/signin", (req, res) => {
  res.send("Hello");
});

export default userRoute;
