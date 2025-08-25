import mongoose from "mongoose";
import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("ERROR IN GENERATING THE GENRATE AND ACCES TOKEN", Error);
    throw new ApiError(
      500,
      "something went Wrong  in making the access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    throw new ApiError(
      400,
      "All fields (fullName, email, username, password) are required"
    );
  }

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields must have non-empty values");
  }

  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // avatar is not decided yet

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "user registered successfully", createdUser));
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and Password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User Not Exists");
  }

  const isPassword = await user.isPasswordCorrect(password);

  if (!isPassword) {
    throw new ApiError(400, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refreshToken },
        "user LoggedIn successfully"
      )
    );
});

const logout = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});


const changePassword=asyncHandler(async(req,res,next)=>{
  const {oldPassword,newPassword}=req.body;


  const user=await User.findById(req.user._id);

  const isPassword=await user.isPasswordCorrect(oldPassword);
  
  if(!isPassword){
    throw new ApiError(400,"Invalid User Credentials");
  }

  user.password=newPassword;
  await user.save();

  return res.status(201).json(new ApiResponse(201,{},"password changed successfully"))



})

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
});

const UpdateAccountDetails=asyncHandler(async(req,res,next)=>{
   const {fullName,email,username}=req.body;

   if(!fullName && !email && !username){
     throw new ApiError(400,"All fields are required");
   
   }

   const user=await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullName,
        email,
        username
      }
    },
    {
      new:true,
    
    }

  ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated"));


})




export { generateAccessAndRefreshToken, registerUser, login, logout,changePassword,getCurrentUser,UpdateAccountDetails };
