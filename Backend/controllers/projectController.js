import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
const prisma = new PrismaClient();

// const createProject = async (req, res) => {
//   try {
//     if (!req.userId) {
//       return res.status(401).json({ message: "Unauthorized - No User ID" });
//     }

//     const userData = await prisma.user.findUnique({
//       where: { id: req.userId },
//       select: {
//         charusatId: true,
//         role: true,
//         id: true,
//         department: true,
//         institute: true,
//       },
//     });

//     if (!userData) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log(req.body);

//     const {
//       pname,
//       pdescription,
//       pdefinition,
//       teamSize,
//       pduration,
//       projectPrivacy,
//       techStack,
//       requiredDomain,
//     } = req.body;

//     const { charusatId, department, institute } = userData;
//     if (!department) {
//       return res.status(400).json({ message: "User department not found" });
//     }

//     // Define storage path
//     const projectFolder = path.join(
//       "uploads/projectDocumentation",
//       institute,
//       department,
//       `${charusatId}_${pname}`
//     );

//     // Ensure the folder exists
//     if (!fs.existsSync(projectFolder)) {
//       fs.mkdirSync(projectFolder, { recursive: true });
//     }

//     const newFilenames = [];

//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const newPath = path.join(projectFolder, file.originalname);
//         fs.renameSync(file.path, newPath);
//         newFilenames.push(newPath);
//       }
//     }

//     const formattedFilenames = newFilenames.map((filePath) =>
//       filePath.replace(/\\/g, "/")
//     );

//     const newProject = await prisma.project.create({
//       data: {
//         pname,
//         pdescription,
//         pdefinition,
//         phost: charusatId,
//         teamSize: Number(teamSize),
//         pduration: Number(pduration),
//         projectPrivacy,
//         // Only include non-empty strings in arrays!
//         requiredDomain: Array.isArray(requiredDomain)
//           ? requiredDomain
//               .flat()
//               .filter((x) => typeof x === "string" && x.trim() !== "")
//           : typeof requiredDomain === "string"
//           ? [requiredDomain]
//           : [],
//         techStack: Array.isArray(techStack)
//           ? techStack
//               .flat()
//               .filter((x) => typeof x === "string" && x.trim() !== "")
//           : typeof techStack === "string"
//           ? [techStack]
//           : [],
//         documentation: formattedFilenames,
//         members: {
//           create: {
//             charusatId,
//             role: userData.role,
//           },
//         },
//       },
//     });

//     await prisma.user.update({
//       where: { id: userData.id },
//       data: {
//         currWorkingProjects: {
//           push: newProject.id.toString(),
//         },
//       },
//     });

//     return res
//       .status(200)
//       .json({ message: "Project created successfully", project: newProject });
//   } catch (error) {
//     console.error("Error creating project:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };




function arrayify(val) {
  if (Array.isArray(val)) return val.filter(x => x && x.trim());
  if (typeof val === "string" && val.trim() !== "") return [val];
  return [];
}

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
      techStack,
      requiredDomain,
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

    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    const newFilenames = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newPath = path.join(projectFolder, file.originalname);
        fs.renameSync(file.path, newPath);
        newFilenames.push(newPath.replace(/\\/g, "/"));
      }
    }

    // --- The important part: Always arrays for Prisma String[] ---
    const requiredDomainArr = arrayify(requiredDomain);
    const techStackArr = arrayify(techStack);

    // Optionally log for debugging
    // console.log("requiredDomainArr:", requiredDomainArr, typeof requiredDomainArr, Array.isArray(requiredDomainArr));
    // console.log("techStackArr:", techStackArr, typeof techStackArr, Array.isArray(techStackArr));

    const newProject = await prisma.project.create({
      data: {
        pname,
        pdescription,
        pdefinition,
        phost: charusatId,
        teamSize: Number(teamSize),
        pduration: Number(pduration),
        projectPrivacy,
        requiredDomain: requiredDomainArr,
        techStack: techStackArr,
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
            <p>Hi ${project.phost}(Project Host),</p>
            <p>Hi ${project.phost}(Project Host),</p>

            <p><strong>${user.firstName} ${user.lastName}</strong> (<a href="mailto:${user.email}">${user.email}</a>) is interested in joining your project, <strong>${project.pname}</strong>.</p>

            <p>They would love to contribute and be part of your team. Please review their request and let them know your decision.</p>

            <p>Feel free to reach out to them directly if you need more details.</p>

            <p>Best regards,</p>
            <p>ProjectPlus Team</p>
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
      const existingMember = await prisma.member.findUnique({
        where: {
          charusatId_projectId: {
            charusatId: request.user.charusatId,
            projectId: request.project.id,
          },
        },
      });

      if (!existingMember) {
        await prisma.member.create({
          data: {
            charusatId: request.user.charusatId,
            role: "STUDENT",
            projectId: request.project.id,
          },
        });

        await prisma.user.update({
          where: { id: request.userId },
          data: {
            currWorkingProjects: {
              push: request.projectId.toString(),
            },
          },
        });
      }
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
        <p>Hi ${request.user.charusatId}(${request.user.firstName} ${request.user.lastName}),</p>
        <p>Your request to join the project <strong>${request.project.pname}</strong> has been <strong style="color:green;">approved</strong> by the ${request.project.phost}(Project Host).</p>
        <p>The project has been added to your working projects list. Welcome to the team! 🚀</p>
        <p>Best regards,<br>ProjectPlus Team</p>
      `;
    } else {
      emailSubject = "Your Project Request was Rejected ❌";
      emailHtml = `
        <p>Hi ${request.user.charusatId}(${request.user.firstName} ${request.user.lastName}),</p>
        <p>Unfortunately, your request to join the project <strong>${request.project.pname}</strong> has been <strong style="color:red;">rejected</strong> by the ${request.project.phost}(Project Host).</p>
        <p>We encourage you to explore other projects that match your skills.</p>
        <p>Best regards,<br>ProjectPlus Team</p>
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

const showPrequestForParticularProject = async (req, res) => {
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

const showHostedProjectRequests = async (req, res) => {
  try {
    // Assume req.userId is the ID of the currently logged-in user
    const { userId } = req;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Find all projects where the user is the host
    const hostedProjects = await prisma.project.findMany({
      where: { phost: userData.charusatId },
      select: {
        id: true,
        pname: true,
        prequest: {
          select: {
            id: true,
            userId: true,
            status: true,
            user: {
              select: {
                profilePhoto: true,
                firstName: true,
                lastName: true,
                charusatId: true,
              },
            },
          },
        },
      },
    });

    // If no projects found, return an empty response
    if (!hostedProjects || hostedProjects.length === 0) {
      return res.status(404).json({ msg: "No hosted projects found" });
    }

    // Format the response to include project requests
    const projectRequests = hostedProjects.map((project) => ({
      projectId: project.id,
      projectName: project.pname,
      requests: project.prequest.map((request) => ({
        requestId: request.id,
        userId: request.userId,
        status: request.status,
        profilePhoto: request.user?.profilePhoto || null,
        firstName: request.user?.firstName || "Unknown",
        lastName: request.user?.lastName || "Unknown",
        charusatId: request.user?.charusatId || "N/A",
      })),
    }));

    return res.status(200).json({
      msg: "Hosted project requests retrieved successfully",
      data: projectRequests,
    });
  } catch (error) {
    console.error("Error fetching hosted project requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserCurrWorkingProject = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currWorkingProjects: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.currWorkingProjects || user.currWorkingProjects.length === 0) {
      return res
        .status(404)
        .json({ msg: "You have no current Working projects" });
    }

    const projectIds = user.currWorkingProjects
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
    });

    return res.json(projects);
  } catch (error) {
    console.error("Error fetching current working projects:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const getAllProjects = async (req, res) => {
//   try {
//     const allProjects = await prisma.project.findMany({
//       select: {
//         id: true,
//         pname: true,
//         pdescription: true,
//         pdefinition: true,
//         phost: true,
//         teamSize: true,
//         members: true,
//         mentors: true,
//         pduration: true,
//         requiredDomain: true,
//         techStack: true,
//         projectPrivacy: true,
//       },
//     });

//     if (!allProjects || allProjects.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No Project Found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "All Data of Project fetched successfully",
//       projects: allProjects,
//     });
//   } catch (err) {
//     console.log("Error Fetching all Project from the DB: ", err);
//     return res.status(500).json({ message: "Internal Server error" });
//   }
// };

const getAllProjects = async (req, res) => {
  try {
    const { hostRole, domains, minTeamSize, maxTeamSize, privacy, search } =
      req.query;

    // Prepare filter object
    let where = {};

    // Host Role Filter
    if (hostRole) {
      const users = await prisma.user.findMany({
        where: { role: hostRole },
        select: { charusatId: true },
      });
      const charusatIds = users.map((u) => u.charusatId);
      if (charusatIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No projects found (no users with given role)",
          projects: [],
        });
      }
      where.phost = { in: charusatIds };
    }

    // Domain filter
    if (domains) {
      where.requiredDomain = { hasSome: domains.split(",") };
    }

    // Team size filter
    if (minTeamSize || maxTeamSize) {
      where.teamSize = {};
      if (minTeamSize) where.teamSize.gte = parseInt(minTeamSize);
      if (maxTeamSize) where.teamSize.lte = parseInt(maxTeamSize);
    }

    // Privacy filter
    if (privacy && privacy !== "all") {
      where.projectPrivacy = privacy;
    }

    // Search filter
    if (search) {
      where.OR = [
        { pname: { contains: search, mode: "insensitive" } },
        { pdescription: { contains: search, mode: "insensitive" } },
      ];
    }

    // Prisma query
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        pname: true,
        pdescription: true,
        pdefinition: true,
        phost: true,
        teamSize: true,
        members: true,
        mentors: true,
        pduration: true,
        requiredDomain: true,
        techStack: true,
        projectPrivacy: true,
        upvotes: true,
      },
      orderBy: { id: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      projects,
    });
  } catch (err) {
    console.error("Error Fetching all Project from the DB:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server error",
      error: err.message,
    });
  }
};

const getParticularProjectDetails = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId, 10);

    if (!projectId) {
      return res
        .status(400)
        .json({
          message: "Project ID is required and must be a valid number.",
        });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: {
            charusatId: true,
            role: true,
          },
        },
        mentors: {
          select: {
            name: true,
          },
        },
        suggestions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Fetch user details for each member
    const memberIds = project.members.map((member) => member.charusatId);
    const users = await prisma.user.findMany({
      where: { charusatId: { in: memberIds } },
      select: { charusatId: true, firstName: true, lastName: true },
    });

    // Map members to include name
    const formattedMembers = project.members.map((member) => {
      const user = users.find((u) => u.charusatId === member.charusatId);
      return {
        charusatId: member.charusatId,
        role: member.role,
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      };
    });

    return res.status(200).json({ ...project, members: formattedMembers });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createProject,
  addMentor,
  sendRequest,
  requestResult,
  updateProject,
  showPrequestForParticularProject,
  showHostedProjectRequests,
  getUserCurrWorkingProject,
  getAllProjects,
  getParticularProjectDetails,
};
