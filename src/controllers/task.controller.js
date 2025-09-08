import Task from "../models/task.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTask=asyncHandler(async(req,res,next)=>{

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

})


const getAllTasks = asyncHandler(async (req, res, next) => {

    const userId = req.user.id;
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    const tasks = await Task.find({ userId });

    return res.status(200).json(
      new ApiResponse(200, tasks, "Tasks fetched successfully")
    );

  
});

const getTaskById=asyncHandler(async(req,res,next)=>{
  
    
    const taskId=req.params.id;
    const userId=req.user.id;

    if(!taskId){
      throw new ApiError(400,"task id is required")

    }

    const task=await Task.findOne({_id:taskId,userId});
    if(!task){
      throw new ApiError(404,"task not found")
    }

    return res.status(200).json(new ApiResponse(200,task,"task fetched successfully"))
  
})

const updateTask = asyncHandler(async (req, res, next) => {
  
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, date } = req.body;

    if (!taskId) {
      throw new ApiError(400, "Task ID is required");
    }

    if (!title && !description && !date) {
      throw new ApiError(400, "At least one field is required");
    }

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (date) task.date = date;

    await task.save();

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task updated successfully"));
  
});

const deleteTask=asyncHandler(async(req,res,next)=>{

  const taskId=req.params.id;
  const userId=req.user.id;

  if(!taskId){
    throw new ApiError(400,"task id is required")

  }
  if(!userId){
    throw new ApiError(400,"user id is required")

  }


   const task = await Task.findOneAndDelete({ _id: taskId, userId });
   if (!task) {
     throw new ApiError(404, "Task not found");
   }

  return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
})

const markTaskComplete = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id;
  const userId = req.user._id;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  }

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const task = await Task.findOne({ _id: taskId, userId });

  if (!task) {
    throw new ApiError(404, "Task not found or you are not authorized");
  }

task.isCompleted = req.body.isCompleted ?? true;
  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task marked as completed successfully"));
});



export {createTask,getAllTasks,getTaskById,updateTask,deleteTask,markTaskComplete}