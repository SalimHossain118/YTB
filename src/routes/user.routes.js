import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUse,
  getUserChannelProfile,
  getWatchHistory,
  refreshAccessToken,
  registerUser,
  updateUserAccountDetails,
  updateUserCoverImage,
  updateUserProfilePhoto,
  userLogin,
  userLogout,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
//end-->register--

router.route("/login").post(userLogin);
//--

// secure routes-->
router.route("/logout").post(verifyJWT, userLogout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-current-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-user-account").patch(verifyJWT, updateUserAccountDetails);
router
  .route("/update-profile-avater")
  .patch(verifyJWT, upload.single("avatar"), updateUserProfilePhoto);
router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/get-current-user").get(verifyJWT, getCurrentUse);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
export default router;
