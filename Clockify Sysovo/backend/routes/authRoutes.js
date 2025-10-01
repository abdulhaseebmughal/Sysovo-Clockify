import express from "express";
import { loginUser, logout, addEmployee } from "../controllers/authController.js";

const router = express.Router();

// Login route
router.post("/login", loginUser);
router.post("/logout", logout);

router.post("/add", addEmployee);
export default router;
