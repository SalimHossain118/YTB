import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addComment = asyncHandler(async (req, res) => {});
// end of add comment-->
const getAllComments = asyncHandler(async (req, res) => {});
// end of getAll comments-
const updateComment = asyncHandler(async (req, res) => {});
// end of update comment-->
const deleteComment = asyncHandler(async (req, res) => {});
// end of delete comment-->
export { addComment, getAllComments, updateComment, deleteComment };
