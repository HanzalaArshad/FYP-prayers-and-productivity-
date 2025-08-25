import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})



const UploadOnCloudinary=async(localFilePath)=>{
   try {
    if(!localFilePath){
      console.log("No local File is Provided to Upload On Cloudinary");
      return null;
      
    }

    const response=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})

    fs.unlinkSync(localFilePath);
    return response


   } catch (error) {
     console.error("cloudinary upload error",error);
     if(localFilePath && fs.existsSync(localFilePath)){
       fs.unlinkSync(localFilePath);

     }
     return null;
   }
}

const deleteCloudinary=async(imageUrl,folder='')=>{

   if(!imageUrl){
    console.log("No image URL is Provided to Delete On Cloudinary");
    return null;
    
  
   }

   try {
    // extract file name from url
    const parts =imageUrl.split("/")
    const fileWithExt=parts[parts.length-1]
    const filename=fileWithExt.split(".")[0]

    const publicId=folder?`${folder}/${filename}`:filename;

    const result=await cloudinary.uploader.destroy(publicId)
    return result



    
   } catch (error) {
       console.error("cloudinary delete error",error);
       return null;
       
   }


}


export {UploadOnCloudinary,deleteCloudinary}

