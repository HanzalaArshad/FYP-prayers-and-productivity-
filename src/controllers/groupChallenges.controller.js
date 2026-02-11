import mongoose from "mongoose";
import Group from "../models/group.model.js";
import GroupMember from "../models/groupMember.model.js";
import User from "../models/user.models.js";
import validator from "validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import GroupChallenge from "../models/groupChallenges.model.js";
import GroupChallengeParticipant from "../models/groupChallengesParticipant.model.js";

const createGroupChallenge = asyncHandler(async (req, res) => {
  const { title, description, goal, totalDays, groupId } = req.body;
  const userId = req.user._id;

  if (!title || !description || !goal || !totalDays || !groupId) {
    throw new ApiError(400, "All fields are required");
  }
  if (!validator.isLength(title, { min: 1, max: 100 })) {
    throw new ApiError(400, "Title must be 1-100 characters");
  }
  if (!validator.isLength(description, { min: 1, max: 500 })) {
    throw new ApiError(400, "Description must be 1-500 characters");
  }
  if (!Number.isInteger(totalDays) || totalDays < 1) {
    throw new ApiError(400, "Total days must be a positive integer");
  }
  if (!mongoose.isValidObjectId(groupId)) {
    throw new ApiError(400, "Invalid group ID");
  }

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  const isAdmin = await GroupMember.findOne({ groupId, userId, role: "admin" });
  if (!isAdmin) throw new ApiError(403, "Only admins can create group challenges");
  const existing = await GroupChallenge.findOne({ groupId });
  if (existing) throw new ApiError(400, "Group already has a challenge");

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + totalDays);

  const challenge = await GroupChallenge.create({
    title,
    description,
    goal,
    totalDays,
    startDate,
    endDate,
    groupId,
    createdBy: userId,
    status: "active",
  });

  const members = await GroupMember.find({ groupId });
  const participants = members.map(member => ({
    userId: member.userId,
    groupChallengeId: challenge._id,
    currentDay: 1,
    completed: false,
    dailyProgress: [],
  }));
  await GroupChallengeParticipant.insertMany(participants);

  return res.status(201).json(new ApiResponse(201, challenge, "Group challenge created successfully"));
});

const updateGroupChallenge = asyncHandler(async (req, res) => {
  const { id: challengeId } = req.params;
  const { title, description, goal, totalDays } = req.body;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(challengeId)) {
    throw new ApiError(400, "Invalid challenge ID");
  }

  const challenge = await GroupChallenge.findById(challengeId);
  if (!challenge) throw new ApiError(404, "Group challenge not found");
  const isAdmin = await GroupMember.findOne({ groupId: challenge.groupId, userId, role: "admin" });
  if (!isAdmin) throw new ApiError(403, "Only admins can update group challenges");

  if (title) challenge.title = title;
  if (description) challenge.description = description;
  if (goal) challenge.goal = goal;
  if (totalDays) {
    challenge.totalDays = totalDays;
    challenge.endDate = new Date(challenge.startDate);
    challenge.endDate.setDate(challenge.startDate.getDate() + totalDays);
  }

  await challenge.save();
  return res.status(200).json(new ApiResponse(200, challenge, "Group challenge updated successfully"));
});

const updateGroupChallengeProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: groupChallengeId } = req.params;

  if (!mongoose.isValidObjectId(groupChallengeId)) {
    throw new ApiError(400, "Invalid group challenge ID");
  }

  const challenge = await GroupChallenge.findById(groupChallengeId);
  if (!challenge || challenge.status !== "active") {
    throw new ApiError(404, "Group challenge not found or not active");
  }

  const participant = await GroupChallengeParticipant.findOne({ userId, groupChallengeId });
  if (!participant) {
    throw new ApiError(404, "You are not part of this group challenge");
  }
  if (participant.completed) {
    return res.status(200).json(new ApiResponse(200, participant, "Group challenge already completed"));
  }

  const today = new Date().setHours(0, 0, 0, 0);
  const hasUpdatedToday = participant.dailyProgress.some(
    entry => new Date(entry.date).setHours(0, 0, 0, 0) === today
  );
  if (hasUpdatedToday) {
    throw new ApiError(400, "Progress already updated for today");
  }

  participant.progress += 1;
  participant.currentDay += 1;
  participant.dailyProgress.push({ date: new Date(), increment: 1 });

  if (participant.progress >= challenge.totalDays) {
    participant.completed = true;
    const user = await User.findById(userId);
    user.xp += 100;
    user.badges.push(`${challenge.title} Completed`);
    await user.save();
  }

  await participant.save();
  return res.status(200).json(new ApiResponse(200, participant, "Group challenge progress updated successfully"));
});

const getGroupChallengeLeaderboard = asyncHandler(async (req, res) => {
  const { id: challengeId } = req.params;

  if (!mongoose.isValidObjectId(challengeId)) {
    throw new ApiError(400, "Invalid challenge ID");
  }

  const challenge = await GroupChallenge.findById(challengeId);
  if (!challenge) throw new ApiError(404, "Group challenge not found");

  const leaderboard = await GroupChallengeParticipant.aggregate([
    { $match: { groupChallengeId: challenge._id } },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$user._id",
        username: "$user.username",
        fullName: "$user.fullName",
        progress: 1,
        completed: 1,
        currentDay: 1,
        xp: "$user.xp",
        badges: "$user.badges",
      },
    },
    { $sort: { progress: -1, completed: -1, currentDay: -1 } },
    {
      $setWindowFields: {
        partitionBy: null, // Apply to all documents
        sortBy: { progress: -1 }, // Sort by progress descending
        output: {
          rank: {
            $denseRank: {}, // Assigns same rank for equal progress (handles ties)
          },
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, leaderboard, "Group challenge leaderboard fetched"));
});
export { createGroupChallenge, updateGroupChallenge, getGroupChallengeLeaderboard,updateGroupChallengeProgress };