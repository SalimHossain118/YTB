import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    normalizedName: { type: String, required: true },
    description: {
      type: String,
      required: true,
    },

    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
// Compound unique index to prevent duplicate playlists for the same user
playlistSchema.index({ normalizedName: 1, owner: 1 }, { unique: true });

export const Playlist = mongoose.model("Playlist", playlistSchema);
