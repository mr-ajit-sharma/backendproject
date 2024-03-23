import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while creating the access and refresh token")
    }
}
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
    const { username, email, fullName, password } = req.body
    console.log(req.avatar)

    if ([email, password, fullName, username].some((field) => field.trim() === "")) {
        throw new ApiError(400, "all fields are mandatory")
    }

    const existedUser = await User.findOne({ $or: [{ username: username }, { email: email }] })
    if (existedUser) {
        throw new ApiError(409, "user is already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
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
const loginUser = asyncHandler(async () => {
    // destructure from req.body
    // username or email
    // find the user
    // password check
    // create refresh token and and access token
    // send cookies
    // send response
    const { username, email, password } = req.body
    if (!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new ApiError(404, "user doesnt exist")
    }
    const isPasswordValid = user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // idr hme password or refresh token nhi bhejna h
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // security purpose se sirf server side se edit ho sakta h 
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: accessToken, refreshToken, loggedInUser
            },
                "user logged in successfully")
        )
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        })
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})


export { registerUser, loginUser, logoutUser }


