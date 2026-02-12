import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addMember, createGroup, deleteGroup, getAllGroups, getGroupDetails, getMyGroups, joinGroup, removeMember, searchGroups } from "../controllers/group.controller.js";


const groupRouter = Router()

groupRouter.route("/createGroup").post(verifyJwt,createGroup)
groupRouter.route("/:id/join").post(verifyJwt, joinGroup);
groupRouter.route("/:id/add").post(verifyJwt,addMember)
groupRouter.route("/:id/remove").post(verifyJwt,removeMember)
groupRouter.route("/:id/delete").post(verifyJwt,deleteGroup)
groupRouter.route("/getmyGroup").get(verifyJwt,getMyGroups)
groupRouter.route("/:id/detail").get(verifyJwt,getGroupDetails)
groupRouter.route("/search-groups").get(verifyJwt,searchGroups)
groupRouter.route("/allGroups").get(verifyJwt,getAllGroups    )



// todo 
// kia user group banaye wo khud add kr skta hai , aur kia group ka naame hum unique krain taake koi bhi add hojaye . group private ya public

export default groupRouter