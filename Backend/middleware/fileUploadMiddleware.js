import multer from "multer";
import path from "path";
import prisma from "./prismaClient";

// Multer storage configurations
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/profileImages")); // Profile images folder
  },
  filename: async (req, file, cb) => {
    const userId = req.body.userId; // Assuming `userId` is set by authMiddleware
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.charusatId) {
      return cb(new Error("CharusatId not found for the given userId"));
    }

    const charusatId = user.charusatId;
    cb(null, `${charusatId}_profileImage${path.extname(file.originalname)}`); // Save as charusatId_profileImage
  },
});

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/certificates")); // Certificates folder
  },
  filename: async (req, file, cb) => {
    const userId = req.body.userId; // Assuming `userId` is set by authMiddleware
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.charusatId) {
      return cb(new Error("CharusatId not found for the given userId"));
    }

    const charusatId = user.charusatId;
    cb(null, `${charusatId}_${file.originalname}`); // Save as charusatId_OriginalFileName
  },
});

const uploadProfileImage = multer({ storage: profileImageStorage });
const uploadCertificates = multer({ storage: certificateStorage });

export { uploadProfileImage, uploadCertificates };
