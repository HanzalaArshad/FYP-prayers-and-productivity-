import mongoose from "mongoose";



const taskSchema=new mongoose.Schema({
  
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  title:{
    type:String,
    required:true,
    trim:true

  },
  description:{
    type:String,
    default:""
  
  },
  isCompleted:{
    type:Boolean,
    default:false
  },
  date:{
    type:Date,
    required:true
  
  },

},{timestamps:true})


const Task=mongoose.model("Task",taskSchema)

export default Task;