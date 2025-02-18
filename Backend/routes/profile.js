import express from "express";
import {
  updateProfile,
  getProfile,
  updateProfileImage_avtr,
  addCertificates,
  deleteCertificate,
} from "../controllers/profileController.js";
import {
  uploadProfileImage,
  uploadCertificates,
} from "../middleware/fileUploadMiddleware.js";
import authMiddleware from "../middleware/auth.js";

const profileRoute = express.Router();

profileRoute.post("/updateProfile", authMiddleware, updateProfile);
profileRoute.post(
  "/updateProfileImage",
  authMiddleware,
  uploadProfileImage,
  updateProfileImage_avtr
);
profileRoute.get("/getProfile", authMiddleware, getProfile);
profileRoute.post(
  "/addCertificates",
  authMiddleware,
  uploadCertificates,
  addCertificates
);
profileRoute.delete(
  "/deleteCertificate",
  authMiddleware,
  uploadCertificates,
  deleteCertificate
);

export default profileRoute;
