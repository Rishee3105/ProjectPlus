import express from "express";
import {
  signinUser,
  registerUser,
  forgotPassword,
  verifyCodeAndResetPassword,
} from "../controllers/userController.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.post("/signin", signinUser);
userRoute.get("/signin", (req, res) => {
  res.send("Hello");
});
userRoute.post("/forgotPassword", forgotPassword);
userRoute.post("/resetPassword", verifyCodeAndResetPassword);

export default userRoute;
