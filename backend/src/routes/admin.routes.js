import express from "express";

import { authorizeRole } from "../middleware/roleMiddleware.js";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/pending-users",
  protect,
  authorizeRole("admin"),
  getPendingUsers,
);

router.patch(
  "/users/:userId/approve",
  protect,
  authorizeRole("admin"),
  approveUser,
);

router.patch(
  "/users/:userId/reject",
  protect,
  authorizeRole("admin"),
  rejectUser,
);

export default router;
