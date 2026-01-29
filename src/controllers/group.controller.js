import mongoose from "mongoose";
import Group from "../models/group.model.js";
import GroupMembers from "../models/groupMembers.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import validator from "validator"


const createGroup=asyncHandler(async(req,res,next)=>{
  const {name,description}=req.body;
  const userId=req.user._id;

  if(!name) throw new ApiError(400, "Group Name is Required")
  if(!validator.isLength(name,{min:1,max:100})){
    throw new ApiError(400, "Name must be 1-100 characters");
  }
  if(description && !validator.isLength(description,{min:0,max:1000})){
    throw new ApiError(400, "Description must be max 1000 characters");
  }


  const group=await Group.create({
    name,
    description,
    createdBy:userId
  });

  await GroupMembers.create({
    groupId:group._id,
    userId
  });

  return res.status(200).json(new ApiResponse(200,"group created SuccessFully",group))


})

const joinGroup=asyncHandler(async(req,res,next)=>{
  const {id:groupId}=req.params;
  const userId=req.user._id;


  if(!mongoose.isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");

  const group=await Group.findById(groupId)

  if(!group) throw new ApiError(400,"Group Not Found");

  const existing=await GroupMembers.findOne({groupId,userId})
  
  if(existing) throw new ApiError(400,"User Already joined")
  
  const member=await GroupMembers.create({groupId,userId})
  return res.status(200).json(new ApiResponse(200," Joined group Successfully",member))
});

const getAllGroups = asyncHandler(async (req, res, next) => {
  const groups = await Group.find({}).sort({ createdAt: -1 });
    const groupsWithMemberCount = await Promise.all(
    groups.map(async (group) => {
      const memberCount = await GroupMembers.countDocuments({ groupId: group._id });
      return {
        ...group.toObject(),
        memberCount
      };
    })
  );
  
  return res.status(200).json(new ApiResponse(200, "All groups fetched successfully", groupsWithMemberCount));
});

const getMyGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  const memberships = await GroupMembers.find({ userId }).select('groupId');
  const groupIds = memberships.map(m => m.groupId);
  
  const groups = await Group.find({ _id: { $in: groupIds } }).sort({ createdAt: -1 });
  
  const groupsWithMemberCount = await Promise.all(
    groups.map(async (group) => {
      const memberCount = await GroupMembers.countDocuments({ groupId: group._id });
      return {
        ...group.toObject(),
        memberCount
      };
    })
  );
  
  return res.status(200).json(new ApiResponse(200, "User groups fetched successfully", groupsWithMemberCount));
});


const getGroupMembers = asyncHandler(async (req, res, next) => {
  const { id: groupId } = req.params;
  
  if (!mongoose.isValidObjectId(groupId)) {
    throw new ApiError(400, "Invalid group ID");
  }
  
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }
  
  const members = await GroupMembers.find({ groupId })
    .populate('userId', 'username fullName avatar email')
    .sort({ joinedAt: 1 });
  
  return res.status(200).json(
    new ApiResponse(200, "Group members fetched successfully", members)
  );
});

const leaveGroup = asyncHandler(async (req, res, next) => {
  const { id: groupId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(groupId)) {
    throw new ApiError(400, "Invalid group ID");
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  if (group.createdBy.toString() === userId.toString()) {
    throw new ApiError(400, "Group creator cannot leave the group. Please delete the group instead.");
  }

  const membership = await GroupMembers.findOneAndDelete({ groupId, userId });
  
  if (!membership) {
    throw new ApiError(400, "You are not a member of this group");
  }

  return res.status(200).json(
    new ApiResponse(200, "Left group successfully", { groupId })
  );
});

export  {createGroup, joinGroup, getAllGroups, getMyGroups, getGroupMembers, leaveGroup}