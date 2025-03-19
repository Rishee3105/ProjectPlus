import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
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

const createToken = (id, charusatId, role, firstName, lastName) => {
  const payload = {
    id,
    charusatId,
    role,
    firstName,
    lastName,
  };
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: "2d" };
  return jwt.sign(payload, secretKey, options);
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
        profilePhoto: "uploads/profileImages/default_avtar.jpg",
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

    const token = createToken(
      user.id,
      user.charusatId,
      user.role,
      user.firstName,
      user.lastName
    );
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

    const token = createToken(
      user.id,
      user.charusatId,
      user.role,
      user.firstName,
      user.lastName
    );
    return res.status(200).json({
      token,
      message: "Sign-in Successful",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userData = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!userData) {
      return res.json({ success: false, message: "User not exists" });
    }

    const uniqueCode = crypto.randomBytes(3).toString("hex");
    const expirationTime = new Date(Date.now() + 60000); //Code expires in 1 min

    await prisma.user.update({
      where: { email: email },
      data: {
        resetCode: uniqueCode,
        resetCodeExpires: expirationTime,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "bakenest9@gmail.com",
        pass: "aghm pbse asnm gbwv",
      },
    });

    const mailOptions = {
      from: "bakenest9@gmail.com",
      to: email,
      subject: "Reset Your Password - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the code below to proceed with resetting your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 22px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; display: inline-block;">
              ${uniqueCode}
            </span>
          </div>
          <p>This code is valid for <strong>1 min</strong>. If you didn’t request a password reset, please ignore this email.</p>
          <p>For security reasons, do not share this code with anyone.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      return res.json({
        success: true,
        message: "Password reset code sent to email.",
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error resetting password." });
  }
};

const verifyCodeAndResetPassword = async (req, res) => {
  const { email, code, password, confirmPassword } = req.body;

  try {
    const userData = await prisma.user.findUnique({ where: { email: email } });

    if (!userData) {
      return res.json({ success: false, message: "User does not exist" });
    }

    let targetUser = userData;

    if (
      targetUser.resetCode !== code ||
      new Date() > new Date(targetUser.resetCodeExpires)
    ) {
      return res.json({ success: false, message: "Invalid or expired code." });
    }

    if (password !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return res.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error resetting password." });
  }
};

export { registerUser, signinUser, forgotPassword, verifyCodeAndResetPassword };
