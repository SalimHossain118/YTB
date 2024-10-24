// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

import dotenv from "dotenv";
dotenv.config({ path: "./env" });
import { app } from "./app.js";

import connectDB from "./db/index.js";

//---

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(` ⚙️  Server Running At Port : ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongo DB Connection FAILED ->", error);
  });

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
