import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const createProject = async (req, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.body.userId },
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      pname,
      pdescription,
      pdefinition,
      phost,
      teamSize,
      pduration,
      projectPrivacy,
      requiredDomain,
      techStack,
    } = req.body;

    const newProject = await prisma.project.create({
      data: {
        pname,
        pdescription,
        pdefinition,
        phost,
        teamSize,
        pduration,
        projectPrivacy,
        requiredDomain,
        techStack,
        members: {
          create: {
            charusatId: userData.charusatId,
            role: userData.role,
          },
        },
      },
    });

    const updateUser = await prisma.user.update({
      where: {
        id: userData.id,
      },
      data: {
        currWorkingProjects: {
          push: newProject.id.toString(),
        },
      },
    });

    // console.log(newProject.members);

    return res
      .status(200)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addMentor = async (req, res) => {
  try {
    const { charusatId, name } = req.body;

    const userData = await prisma.user.findUnique({
      where: { id: req.body.userId },
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

export { createProject, addMentor };
