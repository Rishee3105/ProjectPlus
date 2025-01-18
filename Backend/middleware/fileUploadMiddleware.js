import multer from "multer";
import path from "path";

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/profileImages")); 
  },
  filename: async (req, file, cb) => {
    try {
      const userId = req.body.userId; 
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
//       const userId = req.body.userId; 
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


export const uploadProfileImage = multer({
  storage: profileImageStorage
}).single("profileImage"); 

// export const uploadCertificates = multer({
//   storage: certificateStorage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit per file
// }).array("certificates", 10); 
