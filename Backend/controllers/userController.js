import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

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
    });

    // Send verification email
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
      to: email,
      subject: "Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Email Verification</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <a href="http://localhost:3000/user/signin" style="text-decoration: none;">
            <button style="
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              font-size: 16px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">
              Verify Email
            </button>
          </a>
          <p>If you didn't request this email, please ignore it.</p>
        </div>
      `,
    });

    const token = createToken(user.id);
    return res
      .status(201)
      .json({ token, message: "User created and email sent successfully" });
  } catch (error) {
    console.error("Error:", error.message);

    // Handle email-specific errors gracefully
    if (error.message.includes("Missing credentials for")) {
      return res
        .status(500)
        .json({ message: "Email credentials are missing or invalid" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

const signinSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
});

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
