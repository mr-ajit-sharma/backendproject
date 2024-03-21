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
    const { username, email } = req.body
    console.log("email:", email, "username", username)

    if ([fullname, email, password, username].some((field) => field.trim() === "")) {
        throw new ApiError(400, "all fields are mandatory")
    }

    const existedUser = User.findOne({ $or: [{ username }, [email]] })
    if (existedUser) {
        throw new ApiError(409, "user is already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: avatar.url(),
        username: username.toLowerCase(),
        coverImage: coverImage?.url || "",

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "something went wronmng while creating the user")
    }

    return res.status(201).json(ApiResponse(200, createdUser, "successfullly created the user"))
})
export { registerUser }