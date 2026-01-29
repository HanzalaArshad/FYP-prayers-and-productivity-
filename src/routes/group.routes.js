import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createGroup, joinGroup, getAllGroups, getMyGroups, getGroupMembers, leaveGroup } from "../controllers/group.controller.js";

const groupRouter = Router()

groupRouter.route("/createGroup").post(verifyJwt, createGroup)
groupRouter.route("/allGroups").get(verifyJwt, getAllGroups)
groupRouter.route("/myGroups").get(verifyJwt, getMyGroups)
groupRouter.route("/:id/join").post(verifyJwt, joinGroup)
groupRouter.route("/:id/leave").post(verifyJwt, leaveGroup)
groupRouter.route("/:id/members").get(verifyJwt, getGroupMembers)


// todo 
// kia user group banaye wo khud add kr skta hai , aur kia group ka naame hum unique krain taake koi bhi add hojaye . group private ya public

export default groupRouter