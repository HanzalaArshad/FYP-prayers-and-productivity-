import mongoose from "mongoose";
import ChallengeParticipant from "../models/challengeParticipant.model.js";
import User from "../models/user.models.js";
import validator from "validator";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Challenge from "../models/challnges.model.js";

const createChallenge = asyncHandler(async (req, res) => {
  const { title, description, goal, totalDays, isGroup } = req.body;
  const userId = req.user._id;

  if (!title || !description || !goal || !totalDays) {
    throw new ApiError(400, "Title, description, goal, and total days are required");
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

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + totalDays);

  const challenge = await Challenge.create({
    title,
    description,
    goal,
    totalDays,
    startDate,
    endDate,
    isGroup: isGroup ?? false,
    createdBy: userId,
    status: "active",
  });

  return res.status(201).json(new ApiResponse(201, challenge, "Challenge created successfully"));
});

const joinChallenge = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: challengeId } = req.params;

  if (!mongoose.isValidObjectId(challengeId)) {
    throw new ApiError(400, "Invalid challenge ID");
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }
  if (challenge.status !== "active") {
    throw new ApiError(400, "Challenge is not active");
  }

  const existing = await ChallengeParticipant.findOne({ userId, challengeId });
  if (existing) {
    throw new ApiError(400, "User already joined this challenge");
  }

  const participant = await ChallengeParticipant.create({
    userId,
    challengeId,
    currentDay: 1,
    completed: false,
  });

  return res.status(201).json(new ApiResponse(201, participant, "Challenge joined successfully"));
});

const updateProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id: challengeId } = req.params;

  if (!mongoose.isValidObjectId(challengeId)) {
    throw new ApiError(400, "Invalid challenge ID");
  }

  const participant = await ChallengeParticipant.findOne({ userId, challengeId });
  if (!participant) {
    throw new ApiError(404, "You are not part of this challenge");
  }
  if (participant.completed) {
    return res.status(200).json(new ApiResponse(200, participant, "Challenge already completed"));
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge || challenge.status !== "active") {
    throw new ApiError(404, "Challenge not found or not active");
  }

  participant.progress += 1;
  participant.currentDay += 1;

  if (participant.progress >= challenge.totalDays) {
    participant.completed = true;
    const user = await User.findById(userId);
    user.xp += 100;
    user.badges.push(`${challenge.title} Completed`);
    await user.save();
  }

  await participant.save();
  return res.status(200).json(new ApiResponse(200, participant, "Progress updated successfully"));
});

const getMyChallenges = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const challenges = await ChallengeParticipant.find({ userId }).populate("challengeId");
  return res.status(200).json(new ApiResponse(200, challenges, "My challenges fetched successfully"));
});

const getChallengeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid challenge ID");
  }

  const challenge = await Challenge.findById(id).populate("createdBy", "username fullName email");
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  const participants = await ChallengeParticipant.find({ challengeId: id }).populate("userId", "username fullName");
  return res.status(200).json(new ApiResponse(200, { challenge, participants }, "Challenge details fetched"));
});

export { createChallenge, joinChallenge, updateProgress, getMyChallenges, getChallengeDetails };