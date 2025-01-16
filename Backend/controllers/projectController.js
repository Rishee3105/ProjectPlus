import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const createProject=async (req,res)=>{
   try {
    const userData=await prisma.user.findUnique({
      where:{id:req.body.userId}
    })

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const {pname,pdescription,pdefinition,phost,teamSize,pduration,projectPrivacy,requiredDomain,techStack }=req.body;

    const newProject=await prisma.project.create({
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
        members:{
          create:{
            charusatId:userData.charusatId,
            role:userData.role,
          }
        }
      }
    })
    
    // console.log(newProject.members);
    
    return res.status(200).json({ message: "Project created successfully", project: newProject });

   } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
   }
}

export {createProject};