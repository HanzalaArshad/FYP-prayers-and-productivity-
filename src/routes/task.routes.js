import express from "express";
import { Router } from "express";
import { createTask, getAllTasks } from "../controllers/task.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const taskRouter = Router();

// Create a new task
taskRouter.post("/createTask", verifyJwt, createTask);

// Get all tasks for the logged-in user
taskRouter.get("/allTask", verifyJwt, getAllTasks);

export default taskRouter;
