import mongoose from "mongoose";



const challengesSchema=new mongoose.Schema({
  title:{
    type:String,
    required:true,
    trim:true
  },
  description:{
    type:String,
    required:true,
  },
  isGroup:{
    type:Boolean,
    default:true
  },
  goal:{
    type:String,
    required:true
  
  },
  totalDays:{
    type:Number,
    required:true
  
  },
  startDate:{
    type:Date,
    required:true
  
  },
  endDate:{
    type:Date,
    required:true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  
  }

},{timestamps:true})


const Challenge=mongoose.model("Challenge",challengesSchema)

export default Challenge;