import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.model.js";
import { connectDB } from "./src/lib/db.js";

const seedAdmin = async () => {
  try {
    await connectDB();
    
    const email = "admin@solo.com";
    const password = await bcrypt.hash("admin123", 10);
    
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    const admin = new User({
      fullName: "Super Admin",
      email,
      password,
      role: "admin",
      status: "approved",
      balance: 0,
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log("Email: admin@solo.com");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();
