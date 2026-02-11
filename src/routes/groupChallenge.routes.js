import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createGroupChallenge,
  getGroupChallengeLeaderboard,
  updateGroupChallenge,
  updateGroupChallengeProgress,
} from "../controllers/groupChallenges.controller.js";


const groupChallengerouter = express.Router();

groupChallengerouter.route("/group-challenges").post(verifyJwt, createGroupChallenge);
groupChallengerouter.route("/group-challenges/:id").patch(verifyJwt, updateGroupChallenge);
groupChallengerouter.route("/group-challenges/:id/progress").patch(verifyJwt, updateGroupChallengeProgress);

groupChallengerouter.route("/group-challenges/:id/leaderboard").get(verifyJwt, getGroupChallengeLeaderboard);

export default groupChallengerouter;