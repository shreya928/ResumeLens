import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import customizeRoutes from "./routes/customizeRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

console.log("CLIENT URL:", process.env.CLIENT_URL);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors());
// const corsOptions = {
//     origin: true,origin: ["http://localhost:5173", process.env.CLIENT_URL],
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     allowedHeaders: "Content-Type,Authorization", // We must allow the Authorization header
//     credentials: true,
// };
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("SmartResume Backend is working");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/resume", protect, resumeRoutes);
app.use("/api/customize-resume", protect, customizeRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
