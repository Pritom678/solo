import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import taskRoutes from "./routes/task.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 8080;
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // To allow image/pdf loads if needed
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true, // allow cookies
  }),
);
app.use(express.json()); //req.body
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

import { protect } from "./middleware/authMiddleware.js";
import Project from "./models/project.model.js";
import path from "path";

app.get("/uploads/:filename", protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileUrl = `/uploads/${filename}`;
    
    // Find the project associated with this file
    const project = await Project.findOne({ pdfUrl: fileUrl });
    
    if (!project) {
      return res.status(404).json({ message: "File not found or no associated project." });
    }

    // Check if user is admin or the project owner
    if (req.user.role !== "admin" && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this file." });
    }

    res.sendFile(path.join(process.cwd(), "uploads", filename));
  } catch (error) {
    console.error("File fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/projects", projectRoutes);
app.use("/admin", adminRoutes);
app.use("/tasks", taskRoutes);
app.use("/withdrawals", withdrawalRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!", error: err.message });
});

app.listen(PORT, () => {
  console.log(`server running on Port: ${PORT}`);
  connectDB();
});
