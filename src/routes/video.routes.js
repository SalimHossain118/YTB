import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  detleteVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  uploadVideo,
} from "../controllers/video.controller.js";
const router = Router();

// --

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);
router.route("/get-all-videos").get(verifyJWT, getAllVideos);
router.route("/:videoId").get(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  getVideoById
);
router.route("/:videoId").patch(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateVideo
);
router.route("/:videoId").delete(verifyJWT, detleteVideo);
// return

export default router;
