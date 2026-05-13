import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import adminRoutes from "./routes/admin.routes.js";


const app = express();
const PORT = 8080;
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

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/admin", adminRoutes);


app.listen(PORT, () => {
  console.log(`server running on Port: ${PORT}`);
  connectDB();
});
