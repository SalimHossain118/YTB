import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Name Is Mandatory to Create A Playlist");
  }
  if (!description) {
    throw new ApiError(400, "A Description Is Mandatory To Create A Playlist");
  }

  const user = req.user?._id;

  // Normalize the playlist name (remove spaces, convert to lowercase)
  const normalizeName = (str) => str.toLowerCase().replace(/\s+/g, "");

  const normalizedName = normalizeName(name);

  const isExistsPlaylist = await Playlist.findOne({
    normalizedName,
    owner: user,
  });
  if (isExistsPlaylist) {
    throw new ApiError(400, "A playlist with this name already exists");
  }

  const createNewPlaylist = await Playlist.create({
    name,
    normalizedName,
    description,
    owner: user,
  });

  const newPlaylist = await Playlist.findById(createNewPlaylist._id);
  if (!newPlaylist) {
    throw new ApiError(400, "Something Went Worng While Creating Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully"));
});
// end of create Playlist

const addVideoToPlayist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Is Not Valid ");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Is Not Valid");
  }

  const videoToadd = await Video.findById(videoId);
  const thePlaylist = await Playlist.findById(playlistId);

  if (!videoToadd) {
    throw new ApiError(404, "Video Is No Found");
  }

  if (!thePlaylist) {
    throw new ApiError(404, "No Playlist Found");
  }

  if (thePlaylist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "You Are Not Authorized To Add Playlist");
  }

  if (thePlaylist?.videos?.includes(videoId)) {
    throw new ApiError(400, "Video already added to the playlist");
  }

  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $push: { videos: videoId } },
      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "Video added to your playlist")
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Something went wrong");
  }
});

export { createPlayList, addVideoToPlayist };
