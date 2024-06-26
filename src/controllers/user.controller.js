import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
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
const loginUser = asyncHandler(async (req, res) => {
    // destructure from req.body
    // username or email
    // find the user
    // password check
    // create refresh token and and access token
    // send cookies
    // send response
    const { username, email, password } = req.body

    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }
    if (!username && !email) {
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
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(200, {
                    accessToken,
                    refreshToken: newRefreshToken
                }, "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message, "invalid refresh token")
    }
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "getting current user successfully"))
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    // we have to update here the fullname and email
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "all fields are required")
    }
    const user = await User
        .findByIdAndUpdate(req.user?._id, { $set: { fullName, email } }, { new: true })
        .select("-password")
    return res.status(200).json(new ApiResponse(200, user, "update the account details successfully"))
})
const updateUserAvatar = asyncHandler(async (req, res) => {
    // pahle hum file se path fetch kiya
    // check kiya ki path h ki nhi 
    // fir hum log ne dekha ki agar hain to bhi nhi hai to bhi file ko upload karna h lekin ek variable me invoke krke
    // agar file hain to uski id dhudo and use update karo 
    // bad me dhundhane ke bad uske file ka path dalna h uske bad wo new vallue update ho sake isliye true kiya h
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "image is not uploaded")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading on the avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "successfully updated the avatar"))

})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalpath = req.file?.path
    if (!coverImageLocalpath) {
        throw new ApiError(400, "localpath is not found")
    }
    const coverImage = uploadOnCloudinary(coverImageLocalpath)
    if (!coverImage.url) {
        throw new ApiError(400, "coverimage url is not found")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password")
    return res.status(200).json(new ApiResponse(200, user, "successfully updated the coverImage"))
})
const userChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1
            }
        }
    ])
    console.log(channel)
    if (!channel.length) {
        throw new ApiError(400, "channel doesnot exist")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Schema.Types.ObjectId(req.user._id)
            }

        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        // $lookup:
                    }
                ]
            }
        }
    ])
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, userChannelProfile }


