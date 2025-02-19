import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
const prisma = new PrismaClient();

const createProject = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized - No User ID" });
    }

    const userData = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        charusatId: true,
        role: true,
        id: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      pname,
      pdescription,
      pdefinition,
      teamSize,
      pduration,
      projectPrivacy,
      requiredDomain,
      techStack,
    } = req.body;

    const charusatId = userData.charusatId;
    const newFilenames = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newFilename = `${pname}_${charusatId}_${Date.now()}${path.extname(
          file.originalname
        )}`;
        const oldPath = file.path;
        const newPath = path.join("uploads/projectDocumentation", newFilename);

        // Rename the file
        fs.renameSync(oldPath, newPath);
        newFilenames.push(newPath);
      }
    }

    const newProject = await prisma.project.create({
      data: {
        pname,
        pdescription,
        pdefinition,
        phost: charusatId,
        teamSize: teamSize - "0",
        pduration: pduration - "0",
        projectPrivacy,
        requiredDomain,
        techStack,
        documentation: newFilenames,
        members: {
          create: {
            charusatId,
            role: userData.role,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: userData.id },
      data: {
        currWorkingProjects: {
          push: newProject.id.toString(),
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addMentor = async (req, res) => {
  try {
    const { charusatId, name, emailId } = req.body;

    const userData = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        charusatId: true,
        role: true,
        id: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = await prisma.project.findFirst({
      where: { phost: userData.charusatId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const result = await prisma.project.update({
      where: { id: project.id },
      data: {
        mentors: {
          create: {
            charusatId,
            name,
            emailId,
          },
        },
      },
    });

    return res.status(200).json({ message: "Mentor added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendRequest = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.userId;

    if (!userId || !projectId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!user || !project) {
      return res.status(404).json({ message: "User or Project not found" });
    }

    const projectOwner = await prisma.user.findUnique({
      where: {
        charusatId: project.phost,
      },
    });

    const projectOwnerEmail = projectOwner.email;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: projectOwnerEmail,
      subject: "Project Join Request",
      html: `
            <p>Hi ${project.phost},</p>

            <p><strong>${user.firstName} ${user.lastName}</strong> (<a href="mailto:${user.email}">${user.email}</a>) is interested in joining your project, <strong>${project.pname}</strong>.</p>

            <p>They would love to contribute and be part of your team. Please review their request and let them know your decision.</p>

            <p>Feel free to reach out to them directly if you need more details.</p>

            <p>Best regards,</p>
            <p>Project Management Team</p>
      `,
    });

    await prisma.prequest.create({
      data: {
        userId: user.id,
        projectId,
        status: "PENDING",
      },
    });

    return res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const requestResult = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: "Missing requestId or status" });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await prisma.prequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        project: true,
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (status === "APPROVED") {
      await prisma.member.create({
        data: {
          charusatId: request.user.charusatId,
          role: "STUDENT",
          projectId: request.project.id,
        },
      });
    }

    await prisma.prequest.update({
      where: { id: requestId },
      data: { status },
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let emailSubject = "";
    let emailHtml = "";

    if (status === "APPROVED") {
      emailSubject = "Your Project Request was Approved 🎉";
      emailHtml = `
        <p>Hi ${request.user.firstName},</p>
        <p>Your request to join the project <strong>${request.project.pname}</strong> has been <strong style="color:green;">approved</strong> by the host.</p>
        <p>Welcome to the team! 🚀</p>
        <p>Best regards,<br>Project Management Team</p>
      `;
    } else {
      emailSubject = "Your Project Request was Rejected ❌";
      emailHtml = `
        <p>Hi ${request.user.firstName},</p>
        <p>Unfortunately, your request to join the project <strong>${request.project.pname}</strong> has been <strong style="color:red;">rejected</strong> by the host.</p>
        <p>We encourage you to explore other projects that match your skills.</p>
        <p>Best regards,<br>Project Management Team</p>
      `;
    }

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: request.user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    return res
      .status(200)
      .json({ message: `Request ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        charusatId: true,
        role: true,
        id: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const {
      pname,
      pdescription,
      pdefinition,
      teamSize,
      pduration,
      projectPrivacy,
      requiredDomain,
      techStack,
      projectId,
    } = req.body;

    const projectExist = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        phost: true,
      },
    });

    if (!projectExist) {
      return req.status(404).json({
        msg: "Project Does not Exist",
      });
    }

    if (userData.charusatId !== projectExist.phost) {
      return req.status(403).json({
        msg: "Only the project host can update this project",
      });
    }

    const updateProject = await prisma.project.update({
      data: {
        pname,
        pdescription,
        pdefinition,
        teamSize,
        pduration,
        projectPrivacy,
        requiredDomain,
        techStack,
      },
    });

    return res.status(200).json({
      msg: "Project updated successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createProject, addMentor, sendRequest, requestResult, updateProject };
