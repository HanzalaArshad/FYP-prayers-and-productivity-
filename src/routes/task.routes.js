import express from "express";
import { Router } from "express";
import { createTask } from "../controllers/task.controller.js";


const taskRouter=Router()


taskRouter.route("/createTask").post(createTask)



export default taskRouter;