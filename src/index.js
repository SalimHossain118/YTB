// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

import dotenv from "dotenv";
dotenv.config({ path: "./env" });

import connectDB from "./db/index.js";

//---

connectDB();

// db connection--> another methord

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
})();
*/
