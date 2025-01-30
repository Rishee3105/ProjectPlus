import express from "express";
import { createProject, addMentor,sendRequest } from "../controllers/projectController.js";
import authMiddleware from "../middleware/auth.js";

const projectRoute = express.Router();

projectRoute.post("/createProject", authMiddleware, createProject);
projectRoute.post("/addMentor", authMiddleware, addMentor);
projectRoute.post("/sendRequest",authMiddleware,sendRequest);

export default projectRoute;
