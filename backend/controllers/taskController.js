import Task from "../models/Task.js";
import User from "../models/User.js";



export const addTask = async (req, res) => {
  try {
    const { title, assignedTo, specificUser } = req.body;

    if (!title || !assignedTo) {
      return res
        .status(400)
        .json({ message: "Title and SubRole are required" });
    }

    let assignedUserName = "";

    // ✅ Agar specific user select hua hai (all nahi)
    if (specificUser && specificUser !== "all") {
      const user = await User.findById(specificUser);
      if (user) {
        assignedUserName = user.name; // 👈 user ka name lelo
      }
    }

    // ✅ New Task create with assignedUserName
    const newTask = new Task({
      title,
      assignedSubRole: assignedTo,
      assignedUser: specificUser === "all" ? null : specificUser,
      assignedUserName, // 👈 ye add kiya
      status: "Pending",
    });

    await newTask.save();
    res
      .status(201)
      .json({ message: "Task added successfully", task: newTask });
  } catch (err) {
    console.error("❌ Add task error:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ Employee fetches tasks by subRole
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🧠 Logic: Agar task specifically userId ke liye assigned hai, to wo bhi mile.
    // Agar task subRole ke hisab se assigned hai (without assignedUser), to wo bhi mile.
    const tasks = await Task.find({
      $or: [
        { assignedUser: userId }, // ✅ specifically assigned
        { assignedUser: null, assignedSubRole: user.subRole }, // ✅ role-based tasks
      ],
    }).sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
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


// ✅ Update Task (Edit)

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignedTo, specificUser } = req.body; // 👈 include specificUser

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Title and SubRole are required" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        title,
        assignedSubRole: assignedTo,
        assignedUser: specificUser || null, // 👈 update assigned user if provided
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (err) {
    console.error("❌ Error updating task:", err);
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
};


// ✅ Delete Task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting task:", err);
    res.status(500).json({ message: "Failed to delete task", error: err.message });
  }
};


