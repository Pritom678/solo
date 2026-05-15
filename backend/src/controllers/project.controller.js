import Project from "../models/project.model.js";
import User from "../models/user.model.js";

export const createProject = async (req, res) => {
  try {
    const { title, description, revenue, deadline } = req.body;
    
    // Check if file is uploaded
    const pdfUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const project = new Project({
      title,
      description,
      revenue: Number(revenue),
      deadline: new Date(deadline),
      pdfUrl,
      createdBy: req.user._id,
    });

    await project.save();
    res.status(201).json({ message: "Project submitted for approval", project });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Failed to create project", error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    let query = {};
    // Regular users only see their own projects, admins see all
    if (req.user.role !== "admin") {
      query.createdBy = req.user._id;
    }

    const projects = await Project.find(query)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, memberPercentage } = req.body;

    const validStatuses = ["pending_approval", "active", "completed", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const wasAlreadyCompleted = project.status === "completed";

    project.status = status;
    if (status === "active" && memberPercentage !== undefined) {
      project.memberPercentage = Number(memberPercentage);
    }
    await project.save();

    // Credit the member's balance when a project is marked completed (only once)
    if (status === "completed" && !wasAlreadyCompleted) {
      const earned = project.revenue * (project.memberPercentage / 100);
      await User.findByIdAndUpdate(project.createdBy, {
        $inc: { balance: earned },
      });
    }

    res.status(200).json({ message: `Project status updated to ${status}`, project });
  } catch (error) {
    console.error("Update project status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const requestExtension = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date, reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only admin can request extensions
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can request extensions" });
    }

    // Allow re-requesting even if a previous one was rejected
    project.extensionRequest = {
      date: new Date(date),
      reason,
      status: "pending",
    };

    await project.save();
    res.status(200).json({ message: "Extension requested successfully", project });
  } catch (error) {
    console.error("Request extension error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const respondToExtension = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body; // approved or rejected

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(projectId);
    if (!project || !project.extensionRequest) {
      return res.status(404).json({ message: "Project or extension not found" });
    }

    // Only the project owner (member) can respond
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the project owner can respond to this extension" });
    }

    project.extensionRequest.status = status;
    if (status === "approved") {
      project.deadline = project.extensionRequest.date;
    }

    await project.save();
    res.status(200).json({ message: `Extension ${status}`, project });
  } catch (error) {
    console.error("Respond extension error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

