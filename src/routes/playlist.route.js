import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  addVideoToPlayist,
  createPlayList,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create-playlist").post(verifyJWT, createPlayList);
router
  .route("/addvideoToPlaylist/:playlistId/:videoId")
  .patch(verifyJWT, addVideoToPlayist);

export default router;
