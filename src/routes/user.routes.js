import { Router } from "express";
import { changePassword, getCurrentUser, lastActivity, login, logout, refreshAccessToken, registerUser, UpdateAccountDetails } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";



const userRouter=Router()


userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(login)

userRouter.route("/logout").post(verifyJwt,logout)
userRouter.route("/refreshToken").post(refreshAccessToken)
userRouter.use(verifyJwt, lastActivity);


userRouter.route("/change-Password").post(verifyJwt,changePassword)
userRouter.route("/my-account").get(verifyJwt,getCurrentUser)
userRouter.route("/update-Account").post(verifyJwt,UpdateAccountDetails)


export default userRouter;