import mongoose from "mongoose";



const groupMembers=new mongoose.Schema({
  groupId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Group",
    required:true,
    index:true
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },
  joinedAt:{
    type:Date,
    default:Date.now
    
  }
},{timestamps:true})


const GroupMembers=mongoose.model("GroupMembers",groupMembers)

export default GroupMembers;