import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler(async (req, res) => {
    /**
     * get user details from the frontend
     * check validation -not empty
     * check if the user already exist
     * check for images check for avatar
     * upload them to cloudinary
     * create user object-create an entry in the db
     * remove password and refresh token from the response
     * check for the user creation 
     * return res 
     * */
    const { username, email,fullName,password } = req.body
    console.log(req.avatar)

    if ([ email, password,fullName, username].some((field) => field.trim() === "")) {
        throw new ApiError(400, "all fields are mandatory")
    }

    const existedUser =await  User.findOne({ $or: [{ username:username }, {email:email}] })
    if (existedUser) {
        throw new ApiError(409, "user is already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath ;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: avatar.url,
        username: username.toLowerCase(),
        coverImage: coverImage?.url || "",

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "something went wronmng while creating the user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "successfullly created the user"))
})
export default  registerUser


