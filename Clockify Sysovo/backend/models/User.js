import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["CEO", "Manager", "Employee"], // 👈 Main Role
      default: "Employee",
    },
    subRole: {
      type: String,
      enum: ["Developer", "Designer", "Content Writer", "SEO", "Marketing"], // 👈 Sub-categories
      // default: "None",
    },
  },
  { timestamps: true }
);


// 🔒 Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // agar password change nahi hua toh skip
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password method
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
