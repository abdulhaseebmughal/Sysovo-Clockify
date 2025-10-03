import Attendance from "../models/Attendance.js";

export const punchIn = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if already punched in
    const existing = await Attendance.findOne({ userId, punchOutTime: null });
    if (existing) {
      return res.status(400).json({ message: "Already punched in!" });
    }

    const attendance = new Attendance({
      userId,
      punchInTime: new Date(),
    });

    await attendance.save();
    res.status(201).json({ message: "Punch In successful", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const punchOut = async (req, res) => {
  try {
    const userId = req.user.id;

    const attendance = await Attendance.findOne({ userId, punchOutTime: null });
    if (!attendance) {
      return res.status(400).json({ message: "No active session found!" });
    }

    attendance.punchOutTime = new Date();
    const duration =
      (attendance.punchOutTime.getTime() - attendance.punchInTime.getTime()) /
      1000; // in seconds
    attendance.duration = duration;

    await attendance.save();
    res.json({ message: "Punch Out successful", duration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check current session
export const getCurrentSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await Attendance.findOne({
      userId,
      punchOutTime: null,
    });

    if (!session) {
      return res.status(200).json({ isActive: false });
    }

    res.status(200).json({
      isActive: true,
      punchInTime: session.punchInTime,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟩 Get all attendance records (CEO Dashboard)
export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("userId", "name subRole email") 
      .sort({ punchInTime: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete attendance record (CEO or Admin)
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting attendance:", err);
    res.status(500).json({ message: "Failed to delete attendance record", error: err.message });
  }
};



