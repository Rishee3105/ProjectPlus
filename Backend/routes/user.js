import express from "express";
import {
  signinUser,
  registerUser,
  forgotPassword,
  verifyCodeAndResetPassword,
  verifyUser,
  userProfileDetails,
} from "../controllers/userController.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.post("/verify", verifyUser);
userRoute.post("/signin", signinUser);
userRoute.get("/profile", userProfileDetails);
userRoute.post("/forgotPassword", forgotPassword);
userRoute.post("/resetPassword", verifyCodeAndResetPassword);

export default userRoute;