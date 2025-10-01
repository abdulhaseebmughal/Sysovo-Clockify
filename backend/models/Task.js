import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    assignedSubRole: {
      type: String,
      enum: ["Developer", "Designer", "Content Writer", "SEO", "Marketing"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "OnHold", "Completed"],
      default: "Pending", 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
