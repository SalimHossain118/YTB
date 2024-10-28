import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  const coverImageFile = req.files?.coverImage?.[0]?.path;

  if (!avatarFile) {
    throw new ApiError(400, "Profile Picture Cannot Be Empty");
  }

  const profileAvatar = await uploadOnCloudinary(avatarFile);
  let coverImageUrl = "";

  if (coverImageFile) {
    const coverImage = await uploadOnCloudinary(coverImageFile);
    coverImageUrl = coverImage.url;
  }

  const newUser = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: profileAvatar.url,
    coverImage: coverImageUrl,
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

export { registerUser };
