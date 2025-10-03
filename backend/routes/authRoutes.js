import express from "express";
import { loginUser, logout, addEmployee, getAllEmployees, deleteEmployee } from "../controllers/authController.js";

const router = express.Router();

// Login route
router.post("/login", loginUser);
router.post("/logout", logout);

router.post("/add", addEmployee);
router.get("/employees", getAllEmployees);
router.delete("/employee/:id", deleteEmployee);


export default router;
