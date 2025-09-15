import { Router } from "express";
import { createChallenge, getChallengeDetails, getMyChallenges, joinChallenge, updateProgress } from "../controllers/challenge.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";


const challengeRouter=Router()


challengeRouter.route("/create").post(verifyJwt,createChallenge)
challengeRouter.route("/join/:id").post(verifyJwt,joinChallenge)
challengeRouter.route("/:id/progress").patch(verifyJwt, updateProgress)
challengeRouter.route("/my-challenges").get(verifyJwt,getMyChallenges)
challengeRouter.route("/:id/detail").get(verifyJwt,getChallengeDetails)


export default challengeRouter;