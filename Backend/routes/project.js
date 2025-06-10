import express from "express";
import {
  createProject,
  addMentor,
  sendRequest,
  requestResult,
  updateProject,
  showPrequestForParticularProject,
  showHostedProjectRequests,
  getUserCurrWorkingProject,
  getAllProjects,
  getParticularProjectDetails,
  getParticularUserRequestStatus,
  getParticularProjectRequests,
} from "../controllers/projectController.js";
import authMiddleware from "../middleware/auth.js";
import { uploadProjectDocumentation } from "../middleware/fileUploadMiddleware.js";

const projectRoute = express.Router();

projectRoute.post(
  "/createProject",
  authMiddleware,
  uploadProjectDocumentation,
  createProject
);
projectRoute.post("/addMentor", authMiddleware, addMentor);
projectRoute.post("/sendRequest", authMiddleware, sendRequest);
projectRoute.post("/requestResult", authMiddleware, requestResult);
projectRoute.post(
  "/updateProject",
  authMiddleware,
  uploadProjectDocumentation,
  updateProject
);
projectRoute.get(
  "/showPrequestForParticularProject",
  authMiddleware,
  showPrequestForParticularProject
);
projectRoute.get(
  "/showHostedProjectRequests",
  authMiddleware,
  showHostedProjectRequests
);
projectRoute.get(
  "/getUserCurrWorkingProject",
  authMiddleware,
  getUserCurrWorkingProject
);
projectRoute.get("/getAllProjects", authMiddleware, getAllProjects);
projectRoute.get("/getParticularProjectDetails", authMiddleware, getParticularProjectDetails);
projectRoute.get(
  "/getParticularProjectDetails",
  authMiddleware,
  getParticularProjectDetails
);

projectRoute.get(
  "/getParticularUserRequestStatus",
  authMiddleware,
  getParticularUserRequestStatus
);
projectRoute.get(
  "/getParticularProjectRequests",
  authMiddleware,
  getParticularProjectRequests
);

export default projectRoute;
