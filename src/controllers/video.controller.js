import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { application } from "express";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is Required");
  }
  if (!description) {
    throw new ApiError(400, "Description is Required");
  }
  // end of empty checking

  const isTitleExist = await Video.findOne({ title: title });
  if (isTitleExist) {
    throw new ApiError(401, "Title Already Exist, Try another ");
  }
  // end title existing checking

  //   if (!req.videoFile || !req.thumbnail) {
  //     throw new ApiError(
  //       400,
  //       "Please Select Video and Thumbnil to Upload a Video"
  //     );
  //   }

  let videoLocalFile = "";
  let thumbnailLocalFile = "";

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalFile = req.files.videoFile[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalFile = req.files.thumbnail[0].path;
  }

  if (!videoLocalFile) {
    throw new ApiError(400, "Video is requrired");
  }
  if (!thumbnailLocalFile) {
    throw new ApiError(400, "Thumbnil Is Required");
  }

  const video_Url = await uploadOnCloudinary(videoLocalFile);
  const thumbnail_url = await uploadOnCloudinary(thumbnailLocalFile);

  if (!video_Url.url) {
    throw new ApiError(500, "Video Upload Falied try again");
  }

  if (!thumbnail_url.url) {
    throw new ApiError(500, "Thumbnil Upload Failed try again");
  }

  const duration =
    typeof video_Url.duration === "string"
      ? parseFloat(video_Url.duration)
      : video_Url.duration;

  const createNewVideo = await Video.create({
    videoFile: video_Url.url,
    thumbnail: thumbnail_url.url,
    title,
    description,
    duration,
    isPublished: isPublished,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, createNewVideo, "Video uploaded successfully"));
});
// end of publish video-->

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const filter = {};

  if (userId && isValidObjectId(userId)) filter.owner = userId;

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  console.log("filer", filter);

  try {
    const totalVideos = await Video.find(filter);

    // Retrieve paginated and sorted videos-->
    const videos = await Video.find(filter)
      .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          totalPages: Math.ceil(totalVideos / limit),
          currentPage: page,
          totalVideos: totalVideos,
        },
        "Videos retrieved successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Internal Server Error",
      "Can't get Videos"
    );
  }
});
// end of getAllVideos-->

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    if (!videoId) {
      throw new ApiError(400, "Unauthrized Access");
    }

    const findVideo = await Video.findById(videoId);

    if (!findVideo) {
      throw new ApiError(404, "Video Not Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, findVideo, "Video Found Successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      error?.message || " ERROR_MSG_SOMETHING_WENT_WRONG"
    );
  }
});
// end getVideo by id-->

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(400, "No Valied Video");
  }

  let videoLocalFile = "";
  let thumbnailLocalFile = "";

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalFile = req.files.videoFile[0].path;
  }

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalFile = req.files.thumbnail[0].path;
  }

  const videoToBeUpdate = await Video.findById(videoId);

  if (!videoToBeUpdate) {
    throw new ApiError(400, "Video Could Not Found");
  }

  if (req.user?._id.toString() !== videoToBeUpdate.owner.toString()) {
    throw new ApiError(400, "You Are Not Authorised to delete this video");
  }

  const video_Url = videoToBeUpdate.videoFile;
  const thumbnail_url = videoToBeUpdate.thumbnail;

  if (videoLocalFile != "") {
    await deleteFromCloudinary(video_Url);
  }
  if (thumbnailLocalFile != "") {
    await deleteFromCloudinary(thumbnail_url);
  }
  const newVideo_url = videoLocalFile
    ? (await uploadOnCloudinary(videoLocalFile)).secure_url
    : null;
  const newThumbnil_url = thumbnailLocalFile
    ? (await uploadOnCloudinary(thumbnailLocalFile)).secure_url
    : null;

  if (!newVideo_url) {
    throw new ApiError(400, "Faild ,While Updating New Video..");
  }

  if (!newThumbnil_url) {
    throw new ApiError(400, "Failed, While Updating New Thumbnil..");
  }

  if (
    (!title || title.trim() === "") &&
    (!description || description.trim() === "") &&
    !thumbnailLocalFile &&
    !videoLocalFile
  ) {
    throw new ApiError(400, "To Complete Update Must Have To Edit Any Field");
  }

  try {
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (newVideo_url) updateFields.videoFile = newVideo_url;
    if (newThumbnil_url) updateFields.thumbnail = newThumbnil_url;

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateFields },
      { new: true }
    );
    res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Update Successful"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

// end of update video-->

const detleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(409, "Video Is Not Valid");
  }

  const videoToBeDeleted = await Video.findById(videoId);

  if (!videoToBeDeleted) {
    throw new ApiError(409, "There is no Such Video");
  }

  if (req.user?._id.toString() !== videoToBeDeleted.owner.toString()) {
    throw new ApiError(400, "You Are Not Authorised to delete this video");
  }

  const videoUrl = videoToBeDeleted.videoFile;
  const thumbnailUrl = videoToBeDeleted.thumbnail;

  if (!videoUrl || !thumbnailUrl) {
    throw new ApiError(500, "Video or Thumbnil is missing from DB");
  }

  const result = await Video.findByIdAndDelete(videoId);

  await deleteFromCloudinary(videoUrl);
  await deleteFromCloudinary(thumbnailUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, result?.[0], "video successfully deleted"));
});
// end of delete video-->
const togglePublishStatus = asyncHandler(async (req, res) => {});
//end of togglePublish

export {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  detleteVideo,
  togglePublishStatus,
};
