import express from "express";
import { Router } from "express";
import { createTask, deleteTask, getAllTasks, getTaskById, markTaskComplete, updateTask } from "../controllers/task.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const taskRouter = Router();

// Create a new task
taskRouter.route("/createTask").post( verifyJwt, createTask)

taskRouter.route("/allTask").get( verifyJwt, getAllTasks)
taskRouter.route("/:id").get( verifyJwt, getTaskById)
taskRouter.route("/update/:id").put(verifyJwt,updateTask)
taskRouter.route("/delete/:id").delete(verifyJwt,deleteTask)
taskRouter.put("/complete/:id", verifyJwt, markTaskComplete);





export default taskRouter;
