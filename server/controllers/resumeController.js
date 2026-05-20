import fs from "fs";
import { getAIReview } from "../utils/openai.js";
import { extractTextFromPDF } from "../utils/pdfUtils.js";
import Resume from "../models/resumeModel.js";

export const analyzeResume = async (req, res) => {
  try {
    console.log("📤 Resume upload request received");
    console.log("File:", req.file ? req.file.originalname : "No file");
    console.log("User:", req.user ? req.user._id : "No user");

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user) {
      console.log("❌ No user authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const filepath = req.file.path;
    console.log("📄 Processing file:", filepath);

    const resumeText = await extractTextFromPDF(filepath);
    console.log("📝 Extracted text length:", resumeText.length);

    const aiFeedback = await getAIReview(resumeText);
    console.log("🤖 AI feedback generated");

    const resumeUrl = `${req.protocol}://${req.get("host")}/${filepath.replace(/\\/g, "/")}`;

    const newResumeEntry = new Resume({
      originalText: resumeText,
      aiFeedback: aiFeedback,
      originalFileName: req.file.originalname,
      user: req.user._id,
    });

    await newResumeEntry.save();
    console.log("💾 Resume saved to database");

    res.status(200).json({
      resumeText,
      aiFeedback,
      resumeUrl,
    });

    console.log("✅ Resume analysis completed successfully");
  } catch (error) {
    console.error("❌ Resume analysis failed:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to analyze resume", error: error.message });
  }
};
