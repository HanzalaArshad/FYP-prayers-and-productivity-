import mongoose from "mongoose";




const challengeParticipantSchema=new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  
  },
  challengeId:{
   type:mongoose.Schema.Types.ObjectId,
   ref:"Challenge",
   required:true
  
  },
  progress:{
    type:Number,
    default:0
  
  },
  currentDay:{
    type:Number,
    default:1
  },
  completed:{
    type:Boolean,
    default:false
  },
  joinedAt:{
    type:Date,
    default:Date.now
  
 }
},{timestamps:true})


const challengeParticipant=mongoose.model("challengeParticipant",challengeParticipantSchema)

export default challengeParticipant;