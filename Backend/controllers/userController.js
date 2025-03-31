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
      /^([\w.%+-]+@charusat\.edu\.in|[\w.%+-]+@charusat\.ac\.in)$/,
      "Invalid email format"
    ),
  password: zod.string().min(8),
});

const generateRandomVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Verification Code",
    html: `
      <div style="max-width: 500px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
        <h2 style="text-align: center; color: #4CAF50;">Verification Code</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Your verification code is:</p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; border: 2px dashed #4CAF50; display: inline-block; border-radius: 5px;">
          ${verificationCode}
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">This code will expire in 1 hour. Do not share this code with anyone.</p>
        <p style="font-size: 14px; color: #666;">If you did not request this, please ignore this email.</p>
        <p style="font-size: 14px; color: #666;">Best Regards,<br>ProjectPlus Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const removeExpiredUser = async (email) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verificationCode === null) return;

    if (new Date(user.expiresAt) < new Date()) {
      await prisma.user.delete({ where: { email } });
      console.log(`🗑️ Expired unverified user removed: ${email}`);
    }
  } catch (error) {
    console.error("❌ Error removing expired user:", error.message);
  }
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

    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    const existingUserByCharusatId = await prisma.user.findUnique({
      where: { charusatId },
    });

    if (existingUserByEmail && existingUserByCharusatId) {
      return res
        .status(409)
        .json({ msg: "User with this email and Charusat ID already exists" });
    } else if (existingUserByEmail) {
      return res
        .status(409)
        .json({ msg: "User with this email already exists" });
    } else if (existingUserByCharusatId) {
      return res
        .status(409)
        .json({ msg: "User with this Charusat ID already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateRandomVerificationCode();
    console.log(verificationCode);
    
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        charusatId,
        department,
        institute,
        verificationCode,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, verificationCode);
    setTimeout(() => removeExpiredUser(email), 60 * 60 * 1000);

    return res
      .status(200)
      .json({ msg: "Verification email sent successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verificationCode !== verificationCode) {
      return res
        .status(400)
        .json({ msg: "Invalid or expired verification code" });
    }

    if (new Date() > user.expiresAt) {
      await prisma.user.delete({ where: { email } });
      return res
        .status(400)
        .json({ msg: "Verification code expired, please register again" });
    }

    await prisma.user.update({
      where: { email },
      data: { verificationCode: null, expiresAt: null },
    });

    return res.status(200).json({ msg: "User verified successfully!" });
  } catch (error) {
    console.error("Error verifying user:", error.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

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

    const verificationCode = generateRandomVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); //Code expires in 5 min

    await prisma.user.update({
      where: { email: email },
      data: {
        verificationCode: verificationCode,
        expiresAt: expiresAt,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Your Password - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the code below to proceed with resetting your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 22px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; display: inline-block;">
              ${verificationCode}
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

    // Schedule deletion of verification code and expiresAt
    setTimeout(async () => {
      try {
        await prisma.user.update({
          where: { email: email },
          data: {
            verificationCode: null,
            expiresAt: null,
          },
        });
      } catch (error) {
        console.error("Error clearing verification code:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
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

    const targetUser = userData;

    if (
      targetUser.verificationCode !== code ||
      new Date() > new Date(targetUser.expiresAt)
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
        verificationCode: null,
        expiresAt: null,
      },
    });

    return res.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error resetting password." });
  }
};


// const userProfileDetails = async (req, res) => {
//   try {
//     const charusatId = req.query.charusatId; 
//     if (!charusatId) {
//       return res.status(400).json({ message: "charusatId is required" });
//     }

//     const userData = await prisma.user.findUnique({
//       where: { charusatId },
//     });

//     if (!userData) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json(userData);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


const userProfileDetails = async (req, res) => {
  try {
    const charusatId = req.query.charusatId;
    if (!charusatId) {
      return res.status(400).json({ message: "charusatId is required" });
    }

    const userData = await prisma.user.findUnique({
      where: { charusatId },
      include: {
        skills: true,
        experiences: true,
        projects: true,
        certificates: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch details of current working projects
    const currWorkingProjects = await prisma.project.findMany({
      where: { id: { in: userData.currWorkingProjects.map(Number) } },
      select: {
        id: true,
        pname: true,
        pdescription: true,
        phost: true,
        teamSize: true,
        techStack: true,
        pduration: true,
      },
    });

    return res.status(200).json({
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      domain: userData.domain,
      aboutMe: userData.aboutMe,
      currCgpa: userData.currCgpa,
      phoneNumber: userData.phoneNumber,
      profilePhoto: userData.profilePhoto,
      institute: userData.institute, // Added Institute
      department: userData.department, // Added Department
      skills: userData.skills.map((skill) => skill.skill),
      experiences: userData.experiences,
      projects: userData.projects,
      certificates: userData.certificates,
      achievements: userData.achievements,
      socialLinks: userData.socialLinks,
      currWorkingProjects, // Now includes project details instead of just IDs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export {
  registerUser,
  verifyUser,
  signinUser,
  forgotPassword,
  verifyCodeAndResetPassword,
  userProfileDetails
};
