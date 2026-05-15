import User from "../models/user.model.js";

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select("-password");
    res.status(200).json({ message: "Pending users retrieved successfully", users: pendingUsers });
  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.status = "approved";
    await user.save();
    res.status(200).json({ message: "User approved successfully", user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.status = "rejected";
    await user.save();
    res.status(200).json({ message: "User rejected successfully", user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot deactivate an admin." });
    // Toggle: approved ↔ rejected (deactivated)
    user.status = user.status === "rejected" ? "approved" : "rejected";
    await user.save();
    res.status(200).json({ message: `User ${user.status === "rejected" ? "deactivated" : "reactivated"} successfully`, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
