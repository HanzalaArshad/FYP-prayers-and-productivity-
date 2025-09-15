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

  if(!name) throw new ApiError("Group Name is Required")
  if(!validator.isLength(name,{min:1,max:100})){
    throw new ApiError(400, "Name must be 1-100 characters");
  }
 if(!validator.isLength(description,{min:1,max:100})){
    throw new ApiError(400, "description must be 1000 characters");

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

  return res.status(200).json(new ApiResponse(200,group,"group created SuccessFully"))


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
  return res.status(200).json(new ApiResponse(200,member," Joined group Successfully"))
});


export  {createGroup,joinGroup}