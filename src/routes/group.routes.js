import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createGroup, joinGroup } from "../controllers/group.controller.js";


const groupRouter= Router()

groupRouter.route("/createGroup").post(verifyJwt,createGroup)
groupRouter.route("/:id/join").post(verifyJwt, joinGroup);


// todo 
// kia user group banaye wo khud add kr skta hai , aur kia group ka naame hum unique krain taake koi bhi add hojaye . group private ya public

export default groupRouter