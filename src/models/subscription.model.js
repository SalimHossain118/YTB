import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // who flowing me
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // I am flowing whom
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("subscription", subscriptionSchema);
