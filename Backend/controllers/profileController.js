import { PrismaClient } from "@prisma/client";
import { Console } from "console";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

const updateProfile = async (req, res) => {
  try {
    const {
      domain,
      aboutMe,
      currCgpa,
      phoneNumber,
      skills,
      achievements,
      socialLinks,
      experiences,
      projects,
    } = req.body;

    const userId = req.userId;

    const existingProfile = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update the profile using a transaction to ensure atomicity
    const updatedProfile = await prisma.$transaction(async (prisma) => {
      const profile = await prisma.user.update({
        where: { id: userId },
        data: {
          domain,
          aboutMe,
          currCgpa,
          phoneNumber,
          achievements,
          socialLinks,
        },
      });

      // Rewrite associated data
      // Delete existing skills for the user
      await prisma.userSkill.deleteMany({ where: { userId } });
      if (skills && skills.length > 0) {
        await prisma.userSkill.createMany({
          data: skills.map((skill) => ({
            userId,
            skill,
          })),
        });
      }

      await prisma.experience.deleteMany({ where: { userId } });
      if (experiences && experiences.length > 0) {
        await prisma.experience.createMany({
          data: experiences.map((exp) => ({
            userId,
            title: exp.title,
            company: exp.company,
            duration: exp.duration,
            description: exp.description || null,
          })),
        });
      }

      await prisma.userProject.deleteMany({ where: { userId } });
      if (projects && projects.length > 0) {
        await prisma.userProject.createMany({
          data: projects.map((proj) => ({
            userId,
            title: proj.title,
            link: proj.link || null,
            details: proj.details || null,
          })),
        });
      }
      return profile;
    });

    return res
      .status(200)
      .json({ message: "Profile updated successfully", updatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error updating profile",
      details: error.message,
    });
  }
};

const updateProfileImage_avtr = async (req, res) => {
  const profileImage = req.file;

  const userId = req.userId;

  if (profileImage) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.charusatId) {
        return res
          .status(404)
          .json({ message: "CharusatId not found for the given userId" });
      }

      const charusatId = user.charusatId;

      const newProfileImagePath = `uploads/profileImages/${charusatId}_${Date.now()}_${
        profileImage.originalname
      }`;

      if (user.profilePhoto) {
        const oldFilePath = path.join(process.cwd(), user.profilePhoto);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { profilePhoto: newProfileImagePath },
      });

      return res.status(200).json({
        message: "Profile image updated successfully.",
        profilePhoto: newProfileImagePath,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error updating profile image",
        error: err.message,
      });
    }
  } else {
    return res.status(400).json({
      message: "No image file provided.",
    });
  }
};

// Route to add Certificated of a Particular User
const addCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error("User ID is missing in request");
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.charusatId) {
      return res
        .status(404)
        .json({ message: "CharusatId not found for the given userId" });
    }
    const charusatId = user.charusatId;
    const certificateFiles = req.files.map((file) => ({
      title: file.originalname,
      url: `uploads/certificates/${charusatId}_${Date.now()}_${
        file.originalname
      }`,
      userId: userId,
    }));

    await prisma.certificate.createMany({
      data: certificateFiles,
    });

    res.status(200).json({
      message: "Certificates uploaded successfully!",
      certificates: certificateFiles,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error uploading certificates.", error: err.message });
  }
};

// Function to delete a certificate
const deleteCertificate = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error("User ID is missing in request");
    }

    const certificateId = Number(req.body.certificateId);
    if (!certificateId || isNaN(certificateId)) {
      return res.status(400).json({ message: "Invalid Certificate ID" });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (certificate.userId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this certificate",
      });
    }

    if (certificate.url) {
      const filePath = path.join(__dirname, `..${certificate.url}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.certificate.delete({
      where: { id: certificateId },
    });
    res.status(200).json({ message: "Certificate deleted successfully!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting certificate.", error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        charusatId: true,
        institute: true,
        department: true,
        domain: true,
        aboutMe: true,
        currCgpa: true,
        phoneNumber: true,
        profilePhoto: true,
        skills: {
          select: {
            id: true,
            skill: true,
          },
        },
        experiences: {
          select: {
            id: true,
            title: true,
            company: true,
            duration: true,
            description: true,
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            link: true,
            details: true,
          },
        },
        certificates: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        currWorkingProjects: true,
        achievements: true,
        socialLinks: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching profile data:", err);
    res
      .status(500)
      .json({ message: "Error fetching profile data.", error: err.message });
  }
};

export {
  updateProfile,
  getProfile,
  updateProfileImage_avtr,
  deleteCertificate,
  addCertificates,
};
