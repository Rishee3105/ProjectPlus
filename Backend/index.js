const { PrismaClient } = require("@prisma/client");
const express = require("express");
const app = express();
require("dotenv").config();
const prisma = new PrismaClient();

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
