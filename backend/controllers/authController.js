import jwt from "jsonwebtoken";
import User from "../models/User.js";

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT (include subRole also)
    const token = jwt.sign(
      { id: user._id, role: user.role, subRole: user.subRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// POST /api/auth/add
export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, subRole } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Create employee (role always Employee)
    const newUser = new User({
      name,
      email,
      password,
      role: "Employee",
      subRole: subRole || "null", 
    });

    await newUser.save();

    res.status(201).json({
      message: "Employee added successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        subRole: newUser.subRole,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET /api/auth/employees — CEO fetches all employees
export const getAllEmployees = async (req, res) => {
  try {
    // Fetch only employees (role === "Employee")
    const employees = await User.find({ role: "Employee" })
      .select("_id name email subRole createdAt");

    res.status(200).json({ employees });
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Failed to fetch employees", error: err.message });
  }
};

// ✅ DELETE /api/auth/employee/:id
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ message: "Failed to delete employee", error: err.message });
  }
};


