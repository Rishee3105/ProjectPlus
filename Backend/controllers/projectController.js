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
        department: true,
        institute: true,
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

    const { charusatId, department, institute } = userData;
    if (!department) {
      return res.status(400).json({ message: "User department not found" });
    }

    // Define storage path
    const projectFolder = path.join(
      "uploads/projectDocumentation",
      institute,
      department,
      `${charusatId}_${pname}`
    );

    // Ensure the folder exists
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    const newFilenames = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newPath = path.join(projectFolder, file.originalname);
        fs.renameSync(file.path, newPath);
        newFilenames.push(newPath);
      }
    }

    const formattedFilenames = newFilenames.map((filePath) =>
      filePath.replace(/\\/g, "/")
    );

    const newProject = await prisma.project.create({
      data: {
        pname,
        pdescription,
        pdefinition,
        phost: charusatId,
        teamSize: Number(teamSize),
        pduration: Number(pduration),
        projectPrivacy,
        requiredDomain,
        techStack,
        documentation: formattedFilenames,
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
    let deleteDocs = [];
    if (req.body.deleteDocs) {
      try {
        deleteDocs = JSON.parse(req.body.deleteDocs);
        if (!Array.isArray(deleteDocs)) throw new Error("Invalid format");
      } catch (error) {
        return res
          .status(400)
          .json({ msg: "Invalid JSON format in deleteDocs" });
      }
    }

    // console.log(deleteDocs);

    const userData = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        charusatId: true,
        role: true,
        id: true,
        department: true,
        institute: true,
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
      where: { id: Number(projectId) },
      select: { phost: true, documentation: true },
    });

    if (!projectExist) {
      return res.status(404).json({ msg: "Project Does not Exist" });
    }

    if (userData.charusatId !== projectExist.phost) {
      return res
        .status(403)
        .json({ msg: "Only the project host can update this project" });
    }

    let updatedFilenames = projectExist.documentation || [];

    if (deleteDocs.length > 0) {
      const remainingFiles = await Promise.all(
        updatedFilenames.map(async (docPath) => {
          if (deleteDocs.includes(docPath)) {
            try {
              const filePath = path.join(process.cwd(), docPath);
              if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log(`Deleted file: ${filePath}`);
              }
            } catch (err) {
              console.error(`Error deleting file: ${docPath}`, err);
            }
            return null;
          }
          return docPath;
        })
      );

      updatedFilenames = remainingFiles.filter(Boolean);
    }

    if (req.files && req.files.length > 0) {
      const { department, charusatId, institute } = userData;

      if (!department || !institute) {
        return res
          .status(400)
          .json({ msg: "User department or User institute not found" });
      }

      const projectFolder = path.join(
        "uploads/projectDocumentation",
        institute,
        department,
        `${charusatId}_${pname}`
      );

      if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
      }

      for (const file of req.files) {
        const newPath = path.join(projectFolder, file.originalname);
        fs.renameSync(file.path, newPath);
        updatedFilenames.push(newPath);
      }
    }

    const formattedFilenames = updatedFilenames.map((filePath) =>
      filePath.replace(/\\/g, "/")
    );

    await prisma.project.update({
      where: { id: Number(projectId) },
      data: {
        pname,
        pdescription,
        pdefinition,
        teamSize: Number(teamSize),
        pduration: Number(pduration),
        projectPrivacy,
        requiredDomain,
        techStack,
        documentation: formattedFilenames,
      },
    });

    return res.status(200).json({ msg: "Project updated successfully" });
  } catch (err) {
    console.error("Error updating project:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const showPrequest = async (req, res) => {
  try {
    const { projectId } = req.body;

    const projectRequests = await prisma.prequest.findMany({
      where: { projectId: Number(projectId) },
      select: {
        userId: true,
        status: true,
      },
    });

    if (!projectRequests || projectRequests.length === 0) {
      return res
        .status(404)
        .json({ msg: "No requests found for this project" });
    }

    const requestsWithUserData = await Promise.all(
      projectRequests.map(async (request) => {
        const userData = await prisma.user.findUnique({
          where: { id: request.userId },
          select: {
            profilePhoto: true,
            firstName: true,
            lastName: true,
            charusatId: true,
          },
        });

        return {
          userId: request.userId,
          status: request.status,
          profilePhoto: userData?.profilePhoto || null,
          firstName: userData?.firstName || "Unknown",
          lastName: userData?.lastName || "Unknown",
          charusatId: userData?.charusatId || "N/A",
        };
      })
    );

    return res.status(200).json({
      msg: "Requests retrieved successfully",
      requests: requestsWithUserData,
    });
  } catch (error) {
    console.error("Error fetching project requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createProject,
  addMentor,
  sendRequest,
  requestResult,
  updateProject,
  showPrequest,
};
