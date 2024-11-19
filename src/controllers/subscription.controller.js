import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalied channel");
  }

  // find chanel --

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "Channel Not Found");
  }

  const loogedInUser = req.user._id;
  if (!loogedInUser) {
    throw new ApiError(400, "Please Login");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: loogedInUser,
    channel: channel,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "Successfully unsubscribed from channel"));
  } else {
    await Subscription.create({
      subscriber: loogedInUser,
      channel: channel,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Successfully Subscribed from channel"));
  }
});
// end of toggle
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "No Channel Is Found ");
  }

  if (req.user?._id.toString() !== channelId.toString()) {
    throw new ApiError(409, "Unauthorised Request");
  }
  const allSubscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
      },
    },
    {
      $project: {
        subscribers: {
          username: 1,
          fullname: 1,
          avatar: 1,
        },
        subscribersCount: { $size: "$subscribers" },
      },
    },
  ]);

  if (!allSubscribers.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No Subscriber Found"));
  } else {
    return res.status(200).json(
      new ApiResponse(200, {
        subscriber: allSubscribers[0].subscribers,
        subscribersCount: allSubscribers[0].subscribers,
      })
    );
  }
});

// controller to return channel list to which the user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID.");
  }

  // Ensure the requesting user is the same as the subscriber
  if (!req.user || req.user._id.toString() !== subscriberId) {
    throw new ApiError(403, "Unauthorized: You cannot access this resource.");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    // end of match
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "chanelsDetails",
      },
    },
    // end of looup
    {
      $unwind: "$chanelsDetails",
    },
    // end details
    {
      $project: {
        "channelDetails.username": 1,
        "channelDetails.fullName": 1,
        "channelDetails.avatar": 1,
      },
    },
  ]);

  // Format the response data
  const channels = subscribedChannels.map((item) => item.channelDetails);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channels, channelsSubscribedToCount: channels.length },
        "Subscribed channels fetched successfully."
      )
    );
});

export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
