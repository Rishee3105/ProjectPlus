import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

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
      certificates,
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


      // Handle certificates addition
      // if (certificates && certificates.length > 0) {
      //   const charusatId = existingProfile.charusatId;
      //   const certificateFiles = certificates.map((file) => ({
      //     title: file.originalname,
      //     url: `../uploads/certificates/${charusatId}_${file.originalname}`,
      //     userId: userId,
      //   }));

      //   await prisma.certificate.createMany({
      //     data: certificateFiles,
      //   });
      // }

      if (certificates && certificates.length > 0) {
        const charusatId = existingProfile.charusatId;  
        const certificateFiles = certificates.map((file) => {
          const title = file.title;  
          const url = file.url;      
      
          return {
            title, 
            url,   
            userId: userId,  
          };
        });
      
        if (certificateFiles.length > 0) {
          await prisma.certificate.createMany({
            data: certificateFiles,
          });
        } else {
          console.log('No valid certificates to insert.');
        }
      } else {
        console.log('No certificates provided.');
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
  const userId=req.userId;

  if (profileImage) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if(!user || !user.charusatId){
        return res.status(404).json({ message: "CharusatId not found for the given userId" });
      }

      const charusatId = user.charusatId;

      const newProfileImagePath = `uploads/profileImages/${charusatId}_profileImage${path.extname(profileImage.originalname)}`;

      // Check and remove the old profile image file
      if (user.profilePhoto) {
        const oldFilePath = path.join(process.cwd(), user.profilePhoto);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath); // Delete the old file
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

export { updateProfile, getProfile,updateProfileImage_avtr };
