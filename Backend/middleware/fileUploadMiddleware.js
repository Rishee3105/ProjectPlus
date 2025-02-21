import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profileImages");
  },
  filename: async (req, file, cb) => {
    try {
      const userId = req.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.charusatId) {
        throw new Error("CharusatId not found for the given userId");
      }

      const charusatId = user.charusatId;
      const filename = `${charusatId}_${Date.now()}_${file.originalname}`;
      cb(null, filename);
    } catch (error) {
      cb(error, null);
    }
  },
});

export const uploadProfileImage = multer({
  storage: profileImageStorage,
}).single("profileImage");

const projectDocumentationStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      if (!req.userId) {
        return cb(new Error("User ID is missing in request"));
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { charusatId: true, department: true ,institute:true},
      });

      if (!user || !user.charusatId || !user.department || !user.institute) {
        return cb(new Error("User details not found"));
      }

      const { pname } = req.body;
      const projectFolder = path.join(
        "uploads/projectDocumentation",
        user.institute,
        user.department,
        `${user.charusatId}_${pname}`
      );

      // Ensure the folder exists
      if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
      }

      cb(null, projectFolder);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Keep the original file name
    cb(null, file.originalname);
  },
});

export const uploadProjectDocumentation = multer({
  storage: projectDocumentationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).array("documentation", 5);

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/certificates");
  },
  filename: async (req, file, cb) => {
    try {
      if (!req.userId) {
        throw new Error("User ID is missing in request");
      }

      const userId = req.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.charusatId) {
        throw new Error("CharusatId not found for the given userId");
      }

      const charusatId = user.charusatId;
      const filename = `${charusatId}_${Date.now()}_${file.originalname}`;
      cb(null, filename);
    } catch (error) {
      cb(error, null);
    }
  },
});

export const uploadCertificates = multer({
  storage: certificateStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("certificates", 10);
