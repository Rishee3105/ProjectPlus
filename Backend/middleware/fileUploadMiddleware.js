import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client"; 
const prisma = new PrismaClient();

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/profileImages"));
  },
  filename: async (req, file, cb) => {
    try {
      const userId = req.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.charusatId) {
        throw new Error("CharusatId not found for the given userId");
      }

      const charusatId = user.charusatId;
      cb(null, `${charusatId}_profileImage${path.extname(file.originalname)}`);
    } catch (error) {
      cb(error, null);
    }
  },
});

// const certificateStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "../uploads/certificates"));
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const userId = req.userId;
//       const user = await prisma.user.findUnique({ where: { id: userId } });

//       if (!user || !user.charusatId) {
//         throw new Error("CharusatId not found for the given userId");
//       }

//       const charusatId = user.charusatId;
//       cb(null, `${charusatId}_${file.originalname}`);
//     } catch (error) {
//       cb(error, null);
//     }
//   },
// });

const projectDocumentationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/projectDocumentation");
  },
  filename: async function (req, file, cb) {
    try { 
      if (!req.userId) {
        throw new Error("User ID is missing in request");
      }

      const user = await prisma.user.findUnique({ where: { id: req.userId } });

      if (!user || !user.charusatId) {
        throw new Error("CharusatId not found for the given userId");
      }

      const { pname } = req.body;
      const filename = `${pname}_${user.charusatId}_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  },
});

export const uploadProjectDocumentation = multer({
  storage: projectDocumentationStorage,
}).array("documentation", 5);


export const uploadProfileImage = multer({
  storage: profileImageStorage,
}).single("profileImage");

// export const uploadCertificates = multer({
//   storage: certificateStorage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit per file
// }).array("certificates", 10);
