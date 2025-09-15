import mongoose from "mongoose";


const groupSchema=new mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
    maxlength:100

  },
  description:{
    type:String,
    default:"",
    maxlength:1000
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },

},{timestamps:true})


const Group=mongoose.model("Group",groupSchema)

export default Group;