const { PrismaClient } = require("@prisma/client");
const express = require("express");
require("dotenv").config();
const userRoute=require("./routes/user.js");

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

async function connect()
{
   await connectDatabase();
}
connect();

app.use("/user",userRoute);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
