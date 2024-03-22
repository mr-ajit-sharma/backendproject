import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});
// console.log(process.env.CLOUDINARY_CLOUD_NAME)
// console.log(process.env.CLOUDINARY_CLOUD_API)
// console.log(process.env.CLOUDINARY_CLOUD_SECRET)

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath){
            console.error("error in uploading")
            return null
        } 
        // upload file on the clodinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto'
        })
        console.log(response)
        // file has been uploaded successfully
        fs.unlinkSync(localFilePath)
        console.log("file has been uploaded successfully", response.url)
        return response;
    } catch (error) {
        console.log(error,"error in uploading in catch")
        // removed the file as locally saved as temporary files as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}
export { uploadOnCloudinary }