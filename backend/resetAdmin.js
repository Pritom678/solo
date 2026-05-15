import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.model.js";
import { connectDB } from "./src/lib/db.js";

const resetAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@solo.com";
    const password = await bcrypt.hash("admin123", 10);

    const result = await User.findOneAndUpdate(
      { email },
      {
        fullName: "Super Admin",
        email,
        password,
        role: "admin",
        status: "approved",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin account ready!");
    console.log("   Email:    admin@solo.com");
    console.log("   Password: admin123");
    console.log("   Status:   approved");
    console.log("   Balance:  $" + result.balance.toFixed(2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
};

resetAdmin();
