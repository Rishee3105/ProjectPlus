import { PrismaClient } from "@prisma/client";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import userRoute from "./routes/user.js";
import projectRoute from "./routes/project.js";

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("Db connected.");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}


async function connect() {
  await connectDatabase();
}
connect();

app.use("/uploads",express.static('uploads'))
app.use(express.json());

app.use("/user", userRoute);
app.use("/project", projectRoute);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
