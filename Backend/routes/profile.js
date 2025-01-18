import express from "express";
import { updateProfile, getProfile ,updateProfileImage_avtr} from "../controllers/profileController.js";
import {
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

// profileRoute.post(
//   "/uploadCertificates",
//   authMiddleware,
//   (req, res) => {
//     uploadCertificates(req, res, async (err) => {
//       if (err) {
//         return res
//           .status(500)
//           .json({
//             message: "Error uploading certificates",
//             error: err.message,
//           });
//       }
//       req.files = req.files; // Ensure file details are available in the request
//       next();
//     });
//   },
//   updateProfile
// );

profileRoute.get("/getProfile", authMiddleware, getProfile);

export default profileRoute;
