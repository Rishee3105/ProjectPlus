import express from "express";
import {
  updateProfile,
  getProfile,
  updateProfileImage_avtr,
  addCertificates,
  deleteCertificate,
} from "../controllers/profileController.js";
import {
  uploadCertificates,
  uploadProfileImage,
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

profileRoute.get("/getProfile", authMiddleware, getProfile);

export default profileRoute;
