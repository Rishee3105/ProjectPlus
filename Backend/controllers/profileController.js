import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const createProfile = async (req, res) => {
  try {
    const {
      domain,
      aboutMe,
      currCgpa,
      phoneNumber,
      skills,
      achievements,
      socialLinks,
      currWorkingProjects,
      experiences,
      projects,
    } = req.body;

    const userId = req.body.userId;

    const profile = await prisma.user.update({
      where: { id: userId },
      data: {
        domain,
        aboutMe,
        currCgpa,
        phoneNumber,
        achievements,
        socialLinks,
        currWorkingProjects,
      },
    });

    // Insert skills into UserSkill table
    if (skills && skills.length > 0) {
      await prisma.userSkill.createMany({
        data: skills.map((skill) => ({
          userId,
          skill,
        })),
        skipDuplicates: true, // Avoids duplicate skill entries
      });
    }

    // Insert experiences into Experience table
    if (experiences && experiences.length > 0) {
      await prisma.experience.createMany({
        data: experiences.map((exp) => ({
          userId,
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
        })),
      });
    }

    // Insert projects into UserProject table
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

    res.status(200).json({ message: "Profile created successfully", profile });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error creating profile", details: error.message });
  }
};

// Whenever the frontend use this route , at that time you have to first get the default values from the DB and then do updation in that data
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
      currWorkingProjects,
      experiences,
      projects,
    } = req.body;

    const userId = req.body.userId;

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (prisma) => {
      // Update basic user profile
      const updatedProfile = await prisma.user.update({
        where: { id: userId },
        data: {
          domain,
          aboutMe,
          currCgpa,
          phoneNumber,
          achievements,
          socialLinks,
          currWorkingProjects,
        },
      });

      // Rewrite UserSkill table
      await prisma.userSkill.deleteMany({ where: { userId } }); // Clear existing skills
      if (skills && skills.length > 0) {
        await prisma.userSkill.createMany({
          data: skills.map((skill) => ({
            userId,
            skill,
          })),
        });
      }

      // Rewrite Experience table
      await prisma.experience.deleteMany({ where: { userId } }); // Clear existing experiences
      if (experiences && experiences.length > 0) {
        await prisma.experience.createMany({
          data: experiences.map((exp) => ({
            userId,
            title: exp.title,
            company: exp.company,
            duration: exp.duration,
          })),
        });
      }

      // Rewrite UserProject table
      await prisma.userProject.deleteMany({ where: { userId } }); // Clear existing projects
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

      res
        .status(200)
        .json({ message: "Profile updated successfully", updatedProfile });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error updating profile", details: error.message });
  }
};

// Add Profile Image function
const addProfileImage = async (req, res) => {
  try {
    const userId = req.body.userId; // Get userId from middleware
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.charusatId) {
      return res
        .status(404)
        .json({ message: "CharusatId not found for the given userId" });
    }

    const charusatId = user.charusatId;
    const profileImagePath = `../uploads/profileImages/${charusatId}_profileImage${path.extname(
      req.file.originalname
    )}`;

    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: profileImagePath },
    });

    res.status(200).json({
      message: "Profile image uploaded successfully!",
      path: profileImagePath,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error uploading profile image.", error: err.message });
  }
};

// Add Certificates function
const addCertificates = async (req, res) => {
  try {
    const userId = req.body.userId; // Get userId from middleware
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.charusatId) {
      return res
        .status(404)
        .json({ message: "CharusatId not found for the given userId" });
    }

    const charusatId = user.charusatId;
    const certificateFiles = req.files.map((file) => ({
      title: file.originalname,
      url: `../uploads/certificates/${charusatId}_${file.originalname}`,
      userId: userId,
    }));

    // Save certificate details in database
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

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.body.userId; // Get userId from middleware
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.charusatId) {
      return res
        .status(404)
        .json({ message: "CharusatId not found for the given userId" });
    }

    const charusatId = user.charusatId;
    const newProfileImagePath = `../uploads/profileImages/${charusatId}_profileImage${path.extname(
      req.file.originalname
    )}`;

    // Remove old profile image file if it exists
    if (user.profilePhoto) {
      const oldFilePath = path.join(__dirname, `..${user.profilePhoto}`);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // Delete the old file
      }
    }

    // Update database with new profile image path
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: newProfileImagePath },
    });

    res.status(200).json({
      message: "Profile image updated successfully!",
      path: newProfileImagePath,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating profile image.", error: err.message });
  }
};

// Function to delete a certificate
const deleteCertificate = async (req, res) => {
  try {
    const userId = req.body.userId; // Get userId from auth middleware
    const { certificateId } = req.body; // Get certificateId from request body

    // Fetch the certificate record by id
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    // Check if the certificate exists
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Check if the certificate belongs to the logged-in user
    if (certificate.userId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this certificate",
      });
    }

    // Delete the certificate file from the server, if it exists
    if (certificate.url) {
      const filePath = path.join(__dirname, `..${certificate.url}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file
      }
    }

    // Delete the certificate record from the database
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
    const userId = req.body.userId; // Extract userId from auth middleware

    // Fetch all user data including relationships and embedded fields
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

    // Send the full user profile data to the frontend
    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching profile data:", err);
    res
      .status(500)
      .json({ message: "Error fetching profile data.", error: err.message });
  }
};

export {
  createProfile,
  updateProfile,
  addProfileImage,
  addCertificates,
  updateProfileImage,
  deleteCertificate,
  getProfile,
};
