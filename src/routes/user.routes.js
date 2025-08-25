import { Router } from "express";
import { changePassword, getCurrentUser, login, logout, registerUser, UpdateAccountDetails } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";



const userRouter=Router()


userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(login)
userRouter.route("/logout").post(verifyJwt,logout)
userRouter.route("/change-Password").post(verifyJwt,changePassword)
userRouter.route("/my-account").get(verifyJwt,getCurrentUser)
userRouter.route("/update-Account").post(verifyJwt,UpdateAccountDetails)


export default userRouter;