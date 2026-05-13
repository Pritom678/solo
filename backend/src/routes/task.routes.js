import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { create, retrieve } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/task", protect, create);
router.get("/task", protect, retrieve);

export default router;
