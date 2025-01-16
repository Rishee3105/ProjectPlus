import express from "express";
import { createProject } from "../controllers/projectController.js";
import authMiddleware from "../middleware/auth.js";

const projectRoute=express.Router();

projectRoute.post("/createProject",authMiddleware,createProject);

export default projectRoute;