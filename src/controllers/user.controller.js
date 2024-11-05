import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const userInfo = await User.findById(userId);
    const accessToken = userInfo.generateAccessToken();
    const refreshToken = userInfo.generateRefreshToken();

    // refreshToken saving to db-->
    userInfo.refreshToken = refreshToken;
    userInfo.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// end of token genarate -->

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Are Required.");
  }

  const existsUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existsUser) {
    throw new ApiError(409, "User Already Exists");
  }

  // Access the files correctly using `req.files`
  const avatarFile = req.files?.avatar?.[0]?.path;
  //const coverImageFile = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath = "";

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarFile) {
    throw new ApiError(400, "Profile Picture Cannot Be Empty");
  }

  const profileAvatar = await uploadOnCloudinary(avatarFile);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const newUser = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: profileAvatar.url,
    coverImage: coverImage.url,
  });

  const createdNewUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdNewUser) {
    throw new ApiError(500, "Something Went Wrong While Registering");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdNewUser, "User Registration Successful"));
});

// end of RegisterUser--->

const userLogin = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // checking the user input
  if (!username && !email) {
    throw new ApiError(400, "Email or User Name Is Required");
  }

  // verifing user exist or  nit -->

  const isUserExist = await User.findOne({ $or: [{ username }, { email }] });

  if (!isUserExist) {
    throw new ApiError(404, "User Not Found");
  }

  const isPasswordValied = await isUserExist.isPasswordCorrect(password);
  if (!isPasswordValied) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    isUserExist._id
  );

  // angain call user from db to get update information and send cookie

  const loogedinUser = await User.findById(isUserExist._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,

        {
          user: loogedinUser,
          refreshToken,
          accessToken,
        },
        "User loggedIn Successfully"
      )
    );
});
// end of login controller-->

const userLogout = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
// end of userLogut-->

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");

    try {
      //verifying token-->
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      // finding user of the token
      const user = await User.findById(decodedToken._id);
      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
      }

      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      };

      const { accessToken, newRefreshToken } =
        await generateAccessAndRefereshTokens(user._id);

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken: newRefreshToken },
            "Access token refreshed"
          )
        );
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
  }
});
// end of RefreshAccessToken

const changeCurrentPassword = asyncHandler(async (req, res) => {
  console.log("Request Body->", req.body);

  const { oldPassword, newPassword } = req.body;

  const currentUser = await User.findById(req.user._id);

  const matchedPassword = await currentUser.isPasswordCorrect(oldPassword);

  // if passwod check old passord

  if (!matchedPassword) {
    throw new ApiError(400, "Incorrect Password");
  }

  // save to db
  currentUser.password = newPassword;
  await currentUser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
// end of change password-->

const updateUserAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All Fiels are Required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, " User Details Updated Successfully... "));
});

// end of UpdateUser Details--->

const updateUserProfilePhoto = asyncHandler(async (req, res) => {
  const photoLocalPath = req.file?.path;

  if (!photoLocalPath) {
    throw new ApiError(400, "Image Could not Found");
  }

  const profilePhoto = await uploadOnCloudinary(photoLocalPath);

  if (!profilePhoto.url) {
    throw new ApiError(400, "Error While Upload Profile Image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: profilePhoto.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile image updated successfully")
    );
});

// end of update User Profile photo--->

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localCoverImage = req.file?.path;

  if (!localCoverImage) {
    throw new ApiError(400, "Image Could not Found");
  }

  const coverImage = await uploadOnCloudinary(localCoverImage);

  if (!coverImage.url) {
    throw new ApiError(400, "Error While Upload Cover Image");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover Image Updated Successfully")
    );
});

const getCurrentUse = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user);
});
// end of getCurrent user

export {
  registerUser,
  userLogin,
  userLogout,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserAccountDetails,
  updateUserProfilePhoto,
  updateUserCoverImage,
  getCurrentUse,
};
