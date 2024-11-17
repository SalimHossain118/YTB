import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: (process.env.CLOUDINARY_API_KEY = 749668821329823),
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // uploading to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // --after uploading
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// end of upload-->

const deleteFromCloudinary = async (url) => {
  try {
    // to do-->
    // fisrt find the publicId-
    // 2nd get the file type-->

    const publicId = url.split("/").pop().split(".")[0];
    console.log("Public_ID:", publicId);
    const fileType = url.split(".").pop();
    console.log("File_Type:", fileType);

    let resourceType;
    if (fileType === "mp4" || fileType === "mov" || fileType === "avi") {
      resourceType = "video";
    } else {
      resourceType = "image";
    }

    const deletedResult = await cloudinary.uploader.destroy(publicId, {
      type: "upload",
      resource_type: resourceType,
    });
    console.log("Cloudinary response for delete:", deletedResult);
    return deletedResult;
  } catch (error) {
    console.log("Some Thing Went worng While Deleting from Cloudinary");
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
