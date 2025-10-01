import Task from "../models/Task.js";
import User from "../models/User.js";

// ✅ CEO adds a task
export const addTask = async (req, res) => {
  try {
    const { title, assignedTo } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Title and SubRole are required" });
    }

    const newTask = new Task({
      title,
      assignedSubRole: assignedTo,
      status: "Pending", // 👈 Default
    });

    await newTask.save();
    res.status(201).json({ message: "Task added successfully", task: newTask });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Employee fetches tasks by subRole
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const tasks = await Task.find({ assignedSubRole: user.subRole });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ CEO fetches all assigned tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Task Status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("Received status:", status); // 🟢 ADD THIS LINE

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (["Pending", "OnHold", "Completed"].includes(status)) {
      task.status = status;
    } else {
      task.status = "Completed"; // fallback
    }

    await task.save();

    res.json({ message: `Task marked as ${task.status}`, task });
  } catch (err) {
    console.error("❌ Update task error:", err);
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};


