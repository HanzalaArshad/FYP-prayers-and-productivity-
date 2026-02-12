import mongoose from "mongoose";
import validator from "validator";
import Group from "../models/group.model.js";
import GroupMember from "../models/groupMember.model.js";
import Challenge from "../models/challenges.model.js";
import ChallengeParticipant from "../models/challengeParticipant.model.js";
import GroupChallenge from "../models/groupChallenges.model.js";
import GroupChallengeParticipant from "../models/groupChallengesParticipant.model.js";
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
  
  // Check for GROUP CHALLENGE (not old Challenge model)
  const groupChallenge = await GroupChallenge.findOne({ groupId, status: "active" });
  if (groupChallenge) {
    await GroupChallengeParticipant.create({ 
      userId, 
      groupChallengeId: groupChallenge._id, 
      currentDay: 1, 
      completed: false,
      progress: 0,
      dailyProgress: []
    });
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
  
  // Check for GROUP CHALLENGE (not old Challenge model)
  const groupChallenge = await GroupChallenge.findOne({ groupId, status: "active" });
  if (groupChallenge) {
    await GroupChallengeParticipant.create({ 
      userId: memberId, 
      groupChallengeId: groupChallenge._id, 
      currentDay: 1, 
      completed: false,
      progress: 0,
      dailyProgress: []
    });
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

  // Remove from GROUP CHALLENGE participants
  const groupChallenge = await GroupChallenge.findOne({ groupId, status: "active" });
  if (groupChallenge) {
    await GroupChallengeParticipant.deleteOne({ userId: memberId, groupChallengeId: groupChallenge._id });
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

  // Delete group members
  await GroupMember.deleteMany({ groupId });
  
  // Delete GROUP CHALLENGES and participants
  const groupChallenges = await GroupChallenge.find({ groupId });
  const challengeIds = groupChallenges.map(c => c._id);
  await GroupChallengeParticipant.deleteMany({ groupChallengeId: { $in: challengeIds } });
  await GroupChallenge.deleteMany({ groupId });
  
  // Delete old Challenge model entries if any
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

  // ✅ FIX: Fetch GROUP CHALLENGE instead of old Challenge model
  const challenge = await GroupChallenge.findOne({ groupId, status: "active" }).populate("createdBy", "username fullName");
  
  // ✅ FIX: Fetch GROUP CHALLENGE PARTICIPANTS instead of old ChallengeParticipant
  const participants = challenge
    ? await GroupChallengeParticipant.find({ groupChallengeId: challenge._id }).populate("userId", "username fullName")
    : [];

  return res.status(200).json(
    new ApiResponse(200, { group, admins, members: regularMembers, challenge, participants }, "Group details fetched")
  );
});


const getAllGroups = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const groups = await Group.find({
    isPrivate: false,
    joinDeadline: { $gte: new Date() }
  })
  .populate("createdBy", "username fullName")
  .select("name description createdBy joinDeadline createdAt");

  const groupsWithMeta = await Promise.all(
    groups.map(async (group) => {
      const memberCount = await GroupMember.countDocuments({ groupId: group._id });
      const hasJoined = userId ? await GroupMember.exists({ groupId: group._id, userId }) : false;

      return {
        ...group.toObject(),
        memberCount,
        hasJoined: !!hasJoined
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, groupsWithMeta, "All public groups fetched successfully")
  );
});

const leaveGroup = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const member = await GroupMember.findOne({ groupId, userId });
  if (!member) throw new ApiError(404, "You are not a member of this group");

  // Prevent admin from leaving if they're the only admin
  if (member.role === "admin") {
    const adminCount = await GroupMember.countDocuments({ groupId, role: "admin" });
    if (adminCount === 1) {
      throw new ApiError(400, "You are the only admin. Please assign another admin before leaving or delete the group.");
    }
  }

  // Remove from group
  await GroupMember.findByIdAndDelete(member._id);

  // Remove from active group challenge if exists
  const groupChallenge = await GroupChallenge.findOne({ groupId, status: "active" });
  if (groupChallenge) {
    await GroupChallengeParticipant.deleteOne({ userId, groupChallengeId: groupChallenge._id });
  }

  return res.status(200).json(new ApiResponse(200, null, "Left group successfully"));
});

export { 
  createGroup, 
  joinGroup, 
  addMember, 
  removeMember, 
  deleteGroup, 
  searchGroups, 
  getMyGroups, 
  getGroupDetails,
  getAllGroups,
  leaveGroup 
};