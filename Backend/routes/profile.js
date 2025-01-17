import express from "express";
import {
  createProfile,
  updateProfile,
  addProfileImage,
  addCertificates,
  updateProfileImage,
  deleteCertificate,
  getProfile,
} from "../controllers/profileController.js";
import {
  uploadProfileImage,
  uploadCertificates,
} from "../middleware/fileUploadMiddleware.js";
import authMiddleware from "../middleware/auth.js";

const profileRoute = express.Router();

profileRoute.post("/createProfile", authMiddleware, createProfile);
profileRoute.post("/updateProfile", authMiddleware, updateProfile);
profileRoute.post(
  "/addProfileImage",
  authMiddleware,
  uploadProfileImage.single("profileImage"),
  addProfileImage
);
profileRoute.post(
  "/addCertificates",
  authMiddleware,
  uploadCertificates.array("certificates", 10),
  addCertificates
);
profileRoute.put(
  "/updateProfileImage",
  authMiddleware,
  uploadProfileImage.single("profileImage"),
  updateProfileImage
);
profileRoute.delete("/deleteCertificate", authMiddleware, deleteCertificate);

profileRoute.get("/getProfile", authMiddleware, getProfile);

export default profileRoute;
