import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router
  .route("/get-subscribe-toggle-by-id/:channelId")
  .post(verifyJWT, toggleSubscription);
router
  .route("/get-subcriber/:channelId")
  .get(verifyJWT, getUserChannelSubscribers);
router.route("/channels/:subscriberId").get(verifyJWT, getSubscribedChannels);
export default router;
