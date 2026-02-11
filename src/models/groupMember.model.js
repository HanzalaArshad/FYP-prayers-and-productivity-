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
  role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  joinedAt:{
    type:Date,
    default:Date.now
    
  },

},{timestamps:true})


const GroupMember=mongoose.model("GroupMember",groupMembers)

export default GroupMember;