import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser, userLogin, userLogout };
