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


const getAllTasks = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    const tasks = await Task.find({ userId });

    return res.status(200).json(
      new ApiResponse(200, tasks, "Tasks fetched successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Something went wrong in fetching tasks");
  }
});




export {createTask,getAllTasks}