import Withdrawal from "../models/withdrawal.model.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

// ── User: request a withdrawal ────────────────────────────────────────────────

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.balance < parsedAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Your current balance is $${user.balance.toFixed(2)}.`,
      });
    }

    // Check if user already has a pending withdrawal
    const existing = await Withdrawal.findOne({ user: user._id, status: "pending" });
    if (existing) {
      return res.status(400).json({
        message: "You already have a pending withdrawal request. Please wait for it to be processed.",
      });
    }

    // Hold the amount — deduct from balance immediately so it can't be double-spent
    user.balance -= parsedAmount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount: parsedAmount,
      note: note || "",
    });

    res.status(201).json({ message: "Withdrawal request submitted.", withdrawal });
  } catch (error) {
    console.error("Request withdrawal error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ── User: get own withdrawal history ─────────────────────────────────────────

export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ withdrawals });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ── Admin: get all withdrawal requests ───────────────────────────────────────

export const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query; // optional filter: ?status=pending
    const query = status ? { status } : {};

    const withdrawals = await Withdrawal.find(query)
      .populate("user", "fullName email balance")
      .sort({ createdAt: -1 });

    res.status(200).json({ withdrawals });
  } catch (error) {
    console.error("Get all withdrawals error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ── Admin: approve a withdrawal ───────────────────────────────────────────────

export const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawal = await Withdrawal.findById(withdrawalId).populate("user");
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found." });

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "This withdrawal has already been processed." });
    }

    // Balance was already deducted on request — just mark as approved
    withdrawal.status = "approved";
    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal approved.", withdrawal });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ── Admin: instant self-withdrawal (no approval needed) ──────────────────────

export const adminSelfWithdraw = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0." });
    }

    const admin = await User.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: "User not found." });

    // Compute real agency balance:
    // total agency cut from all completed projects minus all approved admin withdrawals
    const completedProjects = await Project.find({ status: "completed" });
    const totalAgencyCut = completedProjects.reduce(
      (sum, p) => sum + p.revenue * ((100 - p.memberPercentage) / 100),
      0
    );

    const adminWithdrawals = await Withdrawal.find({ user: admin._id, status: "approved" });
    const totalWithdrawn = adminWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const agencyBalance = Math.max(0, totalAgencyCut - totalWithdrawn);

    if (parsedAmount > agencyBalance) {
      return res.status(400).json({
        message: `Insufficient agency balance. Available: $${agencyBalance.toFixed(2)}.`,
      });
    }

    // Record as approved immediately — no pending state
    const withdrawal = await Withdrawal.create({
      user: admin._id,
      amount: parsedAmount,
      note: note || "",
      status: "approved",
    });

    const newBalance = Math.max(0, agencyBalance - parsedAmount);

    res.status(201).json({ message: "Withdrawal recorded.", withdrawal, balance: newBalance });
  } catch (error) {
    console.error("Admin self-withdraw error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ── Admin: get own withdrawal history ────────────────────────────────────────

export const getAdminWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ withdrawals });
  } catch (error) {
    console.error("Get admin withdrawals error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNote } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found." });

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "This withdrawal has already been processed." });
    }

    // Refund the held amount back to the user's balance
    await User.findByIdAndUpdate(withdrawal.user, {
      $inc: { balance: withdrawal.amount },
    });

    withdrawal.status = "rejected";
    withdrawal.adminNote = adminNote || "";
    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal rejected and balance refunded.", withdrawal });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
