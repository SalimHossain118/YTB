import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler";

import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";


const createTweet=asyncHandler(async(req,res)=>{

})
// end of create Tweet

const getUserTweet=asyncHandler(async(req,res)={

})
// end of get user tweet

const updateTweet=asyncHandler(async(req,res)=>{

})
// end of update tweet-->
const deleteTweet=asyncHandler(async(req,res)=>{

})
// end of deleteTweet
export{
    createTweet,getUserTweet,updateTweet,deleteTweet
}
