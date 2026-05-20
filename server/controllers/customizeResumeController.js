import { extractTextFromPDF } from "../utils/pdfUtils.js";
import { getOpenAIResponse } from "../utils/openai.js";
import fs from "fs";
import Resume from "../models/resumeModel.js";

export const customizeResume = async (req, res) => {
  try {
    const { jobDesc } = req.body;
    const resumeFile = req.file;

    if (!resumeFile || !jobDesc) {
      return res.status(400).json({
        message: "Both resume PDF and job description are required",
      });
    }

    console.log("📄 Extracting resume text...");
    const resumeText = await extractTextFromPDF(resumeFile.path);

    // ===============================
    // 🔥 STEP 1: ANALYZE JOB DESCRIPTION
    // ===============================
    const analysisPrompt = `
You are an expert recruiter.

Extract the most important requirements from the job description.

Return ONLY valid JSON in this format:
{
  "skills": [],
  "keywords": [],
  "experience": []
}

JOB DESCRIPTION:
${jobDesc}
`;

    console.log("🧠 Analyzing job description...");
    const analysisResponse = await getOpenAIResponse(analysisPrompt);

    let analysisData;

    try {
      analysisData = JSON.parse(analysisResponse);
    } catch (err) {
      console.error("❌ JSON Parse Error (Analysis):", analysisResponse);
      throw new Error("Failed to parse job analysis");
    }

    console.log("✅ Extracted Requirements:", analysisData);

    // ===============================
    // 🔥 STEP 2: CUSTOMIZE RESUME
    // ===============================
    const prompt = `
You are a senior resume strategist and ATS optimization expert.

Your task is to REWRITE and OPTIMIZE the resume to strongly match the job description.

🚨 OBJECTIVES:
- Maximize ATS keyword matching
- Prioritize relevant skills and experience
- Improve impact using measurable results
- Remove weak or irrelevant content

---

🎯 KEY REQUIREMENTS (from job description):

Skills: ${analysisData.skills.join(", ")}
Keywords: ${analysisData.keywords.join(", ")}
Experience: ${analysisData.experience.join(", ")}

---

📌 RULES:
- Do NOT add fake experience
- Improve wording professionally
- Add measurable impact where possible (%, numbers, results)
- Use strong action verbs (Built, Designed, Optimized, Led)
- Make resume job-focused

---

📄 OUTPUT FORMAT (STRICT):
- Plain text only
- Use headings like: ## SECTION NAME ##
- Bullet points must start with "-"
- Dates on separate lines

---

JOB DESCRIPTION:
${jobDesc}

---

ORIGINAL RESUME:
${resumeText}
`;

    console.log("✍️ Generating customized resume...");
    const aiResponse = await getOpenAIResponse(prompt);

    if (!aiResponse) {
      throw new Error("AI returned empty response");
    }
    // ===============================
// 🔥 STEP 3: VALIDATE RESUME (ATS CHECK)
// ===============================
console.log("📊 Validating resume against job description...");

const validationPrompt = `
You are a strict ATS (Applicant Tracking System) evaluator.

Evaluate how well this resume matches the job description.

Return ONLY valid JSON:

{
  "matchScore": number (0-100),
  "missingKeywords": [],
  "strengths": [],
  "weaknesses": []
}

JOB DESCRIPTION:
${jobDesc}

RESUME:
${aiResponse}
`;

const validationResponse = await getOpenAIResponse(validationPrompt);

let validationData;

try {
  let cleaned = validationResponse
    .replace(/```json\s*/i, "")
    .replace(/```/g, "")
    .trim();

  validationData = JSON.parse(cleaned);
} catch (err) {
  console.error("❌ Validation JSON Parse Error:", validationResponse);

  // ✅ fallback instead of crashing
  validationData = {
    matchScore: 0,
    missingKeywords: [],
    strengths: [],
    weaknesses: ["Validation parsing failed"]
  };
}

console.log("✅ ATS Validation:", validationData);

    // ===============================
    // 💾 SAVE TO DATABASE
    // ===============================
    const newResumeEntry = new Resume({
      customizedText: aiResponse,
      originalFileName: resumeFile.originalname,
      user: req.user._id,
    });

    await newResumeEntry.save();

    // Delete uploaded file
    fs.unlinkSync(resumeFile.path);

    console.log("✅ Resume customization completed");

   res.status(200).json({
  customizedText: aiResponse,
  validation: validationData
});

  } catch (error) {
    console.error("❌ Customize Resume Error:", error);
    res.status(500).json({
      message: "Failed to customize resume",
      error: error.message,
    });
  }
};