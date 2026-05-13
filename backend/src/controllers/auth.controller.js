import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import { ENV } from "../lib/env.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).send({ message: "All Fields Required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .send({ message: "Password must 6 characters or long" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: "Invalid Email" });
    }
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).send({ message: "Email Already Exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: "user",
    });

    if (newUser) {
      const savedUser = await newUser.save();
      generateToken(savedUser, res);

      res.status(201).json({
        _id: savedUser._id,
        name: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
        balance: savedUser.balance,
      });
    } else {
      return res.status(400).send({ message: "User Creation Failed" });
    }
  } catch (err) {
    console.error("SignUp Error:", err);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid Credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).send({ message: "Invalid Credentials" });
    }
    
    if (user.status === "rejected") {
      return res.status(403).send({ message: "Your account has been rejected." });
    }
    generateToken(user, res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: user.balance,
    });
  } catch (err) {
    console.log("error in auth controller", err);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  return res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: user.balance,
    });
  } catch (err) {
    console.error("getMe Error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
