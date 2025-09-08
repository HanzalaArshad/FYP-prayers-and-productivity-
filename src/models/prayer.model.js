import mongoose from "mongoose";



const prayerSchema=new mongoose.Schema({
  
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },

  prayerName:{
     type:String,
     enum:["Fajar","Dhuhr","Asr","Maghrib","Isha","Tahajjud"],
     required:true
  },
  isCompleted:{
    type:Boolean,
    default:false,
  
  },
  date:{
    type:String,
    required:true,
  }


},{timestamps:true})


const Prayer=mongoose.model("Prayer",prayerSchema)

export default Prayer;