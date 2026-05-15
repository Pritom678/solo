import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";
import {
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../controllers/withdrawal.controller.js";

const router = express.Router();

// User routes
router.post("/", protect, requestWithdrawal);
router.get("/mine", protect, getMyWithdrawals);

// Admin routes
router.get("/", protect, authorizeRole("admin"), getAllWithdrawals);
router.patch("/:withdrawalId/approve", protect, authorizeRole("admin"), approveWithdrawal);
router.patch("/:withdrawalId/reject", protect, authorizeRole("admin"), rejectWithdrawal);

export default router;
