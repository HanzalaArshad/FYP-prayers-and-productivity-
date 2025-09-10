import mongoose from "mongoose";
import challengeParticipant from "../models/challengeParticipant.model.js";
import Challenge from "../models/challnges.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";


const createChallenge=asyncHandler(async(req,res,next)=>{

  const {title,description,goal,totalDays}=req.body;
  const userId=req.user._id

  if(!title || !description || !goal || !totalDays ){
    throw new ApiError(400,"all fields are required")
  }

  const startDate=new Date()
  const endDate=new Date()
  endDate.setDate(startDate.getDate()+totalDays)

  const challenge=await Challenge.create({
    title,
    description,
    goal,
    totalDays,
    startDate,
    endDate,
    createdBy:userId,
  });

  return res.status(201).json(new ApiResponse(201,challenge,"challenge created successfully"))




})


const joinChallenge=asyncHandler(asyncHandler(async(req,res)=>{
  const userId=req.user._id;
  const {id:challengeId}=req.params


  const challenge=await Challenge.findById(challengeId)
  if(!challenge){
    throw new ApiError(404,"challenge not found")
  }

  const existing  =await challengeParticipant.findOne({userId,challengeId})

  if(existing ){
    throw new ApiError(404,"challenge not found")
  }

  const participant=await challengeParticipant.create({
    userId,
    challengeId,
    currentDay:1,
    completed:false,
  

  })

  return res.status(201).json(new ApiResponse(201,participant,"challenge joined successfully"))
  

}))

const updateProgress=asyncHandler(async(req,res)=>{
  const userId=req.user._id;
  const {id:challengeId}=req.params;
  
if(!mongoose.Types.ObjectId.isValid(challengeId)){
  throw new ApiError(400,"invalid challenge id")

}

const participant=await challengeParticipant.findOne({userId,challengeId});

if(!participant){
  throw new ApiError(404,"you are not the part of the challenge")
}

if(participant.completed){
 return res.status(200).json(new ApiResponse(200,participant));
}

participant.progress+=1;
participant.currentDay+=1;

const challenge =await Challenge.findById(challengeId);
if(!challenge) throw new ApiError(404,"challenge not found");

if(participant.progress>=challenge.totalDays){
  participant.completed=true;

  const user=await User.findById(userId);
  user.xp+=100;
  user.badges.push(`${challenge.title} Completed`)
  await user.save();


  
}

await participant.save()

return res.status(200).json(new ApiResponse(200,participant,"progress updated successfully"));




})

export {createChallenge,joinChallenge,updateProgress}
