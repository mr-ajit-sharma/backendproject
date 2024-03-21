import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_CLOUD_API, 
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET 
});

const uploadOnCloudinary=async (localFilePath)=>{
try {
    if(!localFilePath) return null
    // upload file on the clodinary
    const response=await cloudinary.uploader.upload(
        await localFilePath,{
            resource_type:'auto',
        }
    )
    // file has been uploaded successfully
    console.log("file has been uploaded successfully",response.url)
    return response
} catch (error) {
    fs.unlink(localFilePath)
    // removed the file as locally saved as temporary files as the upload operation got failed
    return null
}
}
export {uploadOnCloudinary}