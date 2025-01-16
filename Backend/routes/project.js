import express from "express";
import { createProject ,addMentor} from "../controllers/projectController.js";
import authMiddleware from "../middleware/auth.js";

const projectRoute=express.Router();

projectRoute.post("/createProject",authMiddleware,createProject);
projectRoute.post("/addMentor",authMiddleware,addMentor);

export default projectRoute;