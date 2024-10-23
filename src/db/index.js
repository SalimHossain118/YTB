import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const mongodbConnectionIns = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB Is Connected --> DB HOST ${mongodbConnectionIns.connection.host}`
    );
  } catch (error) {
    console.log("Mongodb Connection Error", error);
    process.exit(1);
  }
};

export default connectDB;
