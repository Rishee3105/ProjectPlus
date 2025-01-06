import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Validating this schema using the zod input validation
const registerSchema = zod.object({
  email: zod
    .string()
    .email()
    .regex(
      /^([\w._%+-]+@charusat\.edu\.in|[\w._%+-]+@charusat\.ac\.in)$/,
      "Invalid email format"
    ),
  password: zod.string().min(8),
});

// function for creating JWT Token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for the registration and for generating JWT token
const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      charusatId,
      department,
      institute,
    } = req.body;

    const { success } = registerSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        charusatId,
        department,
        institute,
      },
      select: {
        id: true,
      },
    });

    const token = createToken(user.id);
    return res.status(201).json({ token, message: "User created" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// validating Schema using the ZOD input validation
const signinSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
});

// Route for signing in into the website
const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { success } = signinSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Invalid Format of Email Id or Password",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid Email Id or Password",
      });
    }

    const token = createToken(user.id);
    return res.status(200).json({
      token,
      message: "Sign-in Successful",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { registerUser, signinUser };
