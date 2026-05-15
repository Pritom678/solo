import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { fullName, email, password } = parsed.data;

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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid Credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).send({ message: "Invalid Credentials" });
    }
    
    if (user.status === "pending") {
      return res.status(403).send({ message: "Your account is pending admin approval." });
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
    const user = req.user;
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
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
