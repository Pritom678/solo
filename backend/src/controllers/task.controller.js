import Task from "../models/task.model.js";

export const create = async (req, res) => {
  try {
    const { title, description, priority, dueDate, maxMembers } = req.body;

    if (!title || !maxMembers) {
      return res.status(400).send({ message: "Required Title and maxMembers" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      maxMembers,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const retrieve = async (req, res) => {
  try {
    const tasks = await Task.find({
      createdBy: req.user._id,
    });

    res.status(200).json({
      message: "Task Retrieved Successfully",
      tasks,
    });
  } catch (error) {
    console.error("Task Retrive Error: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};
