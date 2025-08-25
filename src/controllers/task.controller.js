import Task from "../models/task.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTask=asyncHandler(async(req,res,next)=>{

 try {
   const {title,description,date}=req.body;
   
   if(!title || !date){
     throw new ApiError(400,"title and date are required")
   }
 
   const task=await Task.create(
     {
       userId:req.user.id,
       title,
       description,
       date,
     
     }
   )
 
   return res.status(201).json(new ApiResponse(201,task,"task created successfully"))
 } catch (error) {
  throw new ApiError(500,"something went wrong in making task")
 }
})



export {createTask}