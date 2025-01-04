import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();

const registerSchema=zod.object({
  email: zod.string().email().regex(
    /^([\w._%+-]+@charusat\.edu\.in|[\w._%+-]+@charusat\.ac\.in)$/,
    "Invalid email format"
  ),
  password:zod.string().min(8)
});

const createToken=(id)=>{
  return jwt.sign({id},process.env.JWT_SECRET);
}

export const registerUser = async (req, res) => {
  try {
    const {firstName,lastName,email,password,role,collegeId,department,institute}=req.body;

    const {success}=registerSchema.safeParse(req.body);
    if(!success)
    {
      return res.status(400).json({message:"Invalid data"});
    }

    const exists=await prisma.user.findUnique({
      where: { email },
    });

    if(exists)
    {
      return res.status(400).json({message:"User already exists"});
    }

    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(password, salt);

    const user=await prisma.user.create({
      data:{
        firstName,
        lastName,
        email,
        password:hashedPassword,
        role,
        collegeId,
        department,
        institute
      },
      select:{
        id:true
      }
    })

    const token=createToken(user);
    res.status(201).json({token,message:"User created"});

  } catch (error) {
    console.log(error);
    res.status(500).json({message:"Internal server error"});
  }
};

