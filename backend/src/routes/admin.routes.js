import express from "express";
import { authorizeRole } from "../middleware/roleMiddleware.js";
import { getPendingUsers, getAllUsers, approveUser, rejectUser, deactivateUser } from "../controllers/admin.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/pending-users", protect, authorizeRole("admin"), getPendingUsers);
router.get("/users", protect, authorizeRole("admin"), getAllUsers);
router.patch("/users/:userId/approve", protect, authorizeRole("admin"), approveUser);
router.patch("/users/:userId/reject", protect, authorizeRole("admin"), rejectUser);
router.patch("/users/:userId/deactivate", protect, authorizeRole("admin"), deactivateUser);

export default router;
