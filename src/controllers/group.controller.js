import mongoose from "mongoose";
import validator from "validator";
import Group from "../models/group.model.js";
import GroupMember from "../models/groupMember.model.js";
import Challenge from "../models/challenges.model.js";
import ChallengeParticipant from "../models/challengeParticipant.model.js";
import {  ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";

const createGroup = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;
  const userId = req.user._id;

  if (!name) throw new ApiError(400, "Group name is required");
  if (!validator.isLength(name, { min: 1, max: 100 })) {
    throw new ApiError(400, "Name must be 1-100 characters");
  }

  const joinDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  const inviteToken = crypto.randomBytes(16).toString("hex");
  const group = await Group.create({ name, description, createdBy: userId, isPrivate: isPrivate ?? false, joinDeadline, inviteToken });
  await GroupMember.create({ groupId: group._id, userId, role: "admin" });

  const inviteLink = `https://yourapp.com/join?groupId=${group._id}&token=${inviteToken}`;
  return res.status(201).json(new ApiResponse(201, { group, inviteLink }, "Group created successfully"));
});

const joinGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const inviteToken = req.body?.inviteToken;  // ← safe destructuring (optional chaining)
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (new Date() > group.joinDeadline) throw new ApiError(400, "Join window has expired");

  // Yeh line fix hai – private ke liye token check, public ke liye skip
  if (group.isPrivate) {
    if (!inviteToken) throw new ApiError(403, "Private group – invite token required");
    if (inviteToken !== group.inviteToken) {
      throw new ApiError(403, "Invalid invite token for private group");
    }
  }

  const existing = await GroupMember.findOne({ groupId, userId });
  if (existing) throw new ApiError(400, "User already in group");

  const member = await GroupMember.create({ groupId, userId, role: "member" });
  const challenge = await Challenge.findOne({ groupId, isGroup: true });
  if (challenge) {
    await ChallengeParticipant.create({ userId, challengeId: challenge._id, currentDay: 1, completed: false });
  }

  return res.status(201).json(new ApiResponse(201, member, "Joined group successfully"));
});

const addMember = asyncHandler(async (req, res) => {
  const groupId=req.params.id
  const {  userId: memberId } = req.body;
  const adminId = req.user._id;

  if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(memberId)) {
    throw new ApiError(400, "Invalid group or user ID");
  }
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (new Date() > group.joinDeadline) throw new ApiError(400, "Join window has expired");
  const isAdmin = await GroupMember.findOne({ groupId, userId: adminId, role: "admin" });
  if (!isAdmin) throw new ApiError(403, "Only admins can add members");

  const existing = await GroupMember.findOne({ groupId, userId: memberId });
  if (existing) throw new ApiError(400, "User already in group");

  const member = await GroupMember.create({ groupId, userId: memberId, role: "member" });
  const challenge = await Challenge.findOne({ groupId, isGroup: true });
  if (challenge) {
    await ChallengeParticipant.create({ userId: memberId, challengeId: challenge._id, currentDay: 1, completed: false });
  }

  return res.status(201).json(new ApiResponse(201, member, "Member added successfully"));
});

const removeMember = asyncHandler(async (req, res) => {

  const groupId=req.params.id
  const { userId: memberId } = req.body;
  const adminId = req.user._id;

  if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(memberId)) {
    throw new ApiError(400, "Invalid group or user ID");
  }
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  const isAdmin = await GroupMember.findOne({ groupId, userId: adminId, role: "admin" });
  if (!isAdmin) throw new ApiError(403, "Only admins can remove members");
  if (adminId.toString() === memberId) throw new ApiError(400, "Admins cannot remove themselves");

  const member = await GroupMember.findOneAndDelete({ groupId, userId: memberId });
  if (!member) throw new ApiError(404, "Member not found in group");

  const challenge = await Challenge.findOne({ groupId, isGroup: true });
  if (challenge) {
    await ChallengeParticipant.deleteOne({ userId: memberId, challengeId: challenge._id });
  }

  return res.status(200).json(new ApiResponse(200, null, "Member removed successfully"));
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  const isAdmin = await GroupMember.findOne({ groupId, userId, role: "admin" });
  if (!isAdmin) throw new ApiError(403, "Only admins can delete group");

  await GroupMember.deleteMany({ groupId });
  await Challenge.deleteMany({ groupId, isGroup: true });
  await ChallengeParticipant.deleteMany({ challengeId: { $in: await Challenge.find({ groupId }).distinct("_id") } });
  await Group.findByIdAndDelete(groupId);

  return res.status(200).json(new ApiResponse(200, null, "Group deleted successfully"));
});

const searchGroups = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) throw new ApiError(400, "Search query is required");
  const groups = await Group.find({
    $and: [
      { isPrivate: false },
      { name: { $regex: query, $options: "i" } },
      { joinDeadline: { $gte: new Date() } },
    ],
  }).select("name description createdBy");
  return res.status(200).json(new ApiResponse(200, groups, "Groups found"));
});

const getMyGroups = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const groups = await GroupMember.find({ userId }).populate("groupId", "name description isPrivate createdBy joinDeadline inviteToken");
  return res.status(200).json(new ApiResponse(200, groups, "Groups fetched successfully"));
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");
  const isMember = await GroupMember.findOne({ groupId, userId });
  if (!isMember) throw new ApiError(403, "You are not a member of this group");

  const group = await Group.findById(groupId).populate("createdBy", "username fullName email");
  if (!group) throw new ApiError(404, "Group not found");

  const members = await GroupMember.find({ groupId }).populate("userId", "username fullName email").select("userId role joinedAt");
  const admins = members.filter(m => m.role === "admin").map(m => ({
    userId: m.userId._id,
    username: m.userId.username,
    fullName: m.userId.fullName,
    email: m.userId.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
  const regularMembers = members.filter(m => m.role === "member").map(m => ({
    userId: m.userId._id,
    username: m.userId.username,
    fullName: m.userId.fullName,
    email: m.userId.email,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  const challenge = await Challenge.findOne({ groupId, isGroup: true }).populate("createdBy", "username fullName");
  const participants = challenge
    ? await ChallengeParticipant.find({ challengeId: challenge._id }).populate("userId", "username fullName")
    : [];

  return res.status(200).json(
    new ApiResponse(200, { group, admins, members: regularMembers, challenge, participants }, "Group details fetched")
  );
});

export { createGroup, joinGroup, addMember, removeMember, deleteGroup, searchGroups, getMyGroups, getGroupDetails };