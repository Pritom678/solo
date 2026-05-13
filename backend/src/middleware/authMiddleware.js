import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    // console.log("Cookies received:", req.cookies);
    const token = req.cookies.jwt;

    if (!token) {
      console.log("No token found in cookies");
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not Found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
