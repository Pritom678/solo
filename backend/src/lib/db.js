import { ENV } from "./env.js";
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) {
      throw new Error("Mongodb is not connected");
    } else {
      await mongoose.connect(ENV.MONGO_URI);
      console.log("Mongodb connected successfully");
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); //1 status code means fail 0 means success
  }
};
