import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const defaultModel = "openai/gpt-3.5-turbo";

const createChatCompletion = async ({ model, messages, temperature, max_tokens }) => {
  const openAIKey = process.env.OPENAI_API_KEY;
  console.log("🔑 API KEY:", process.env.OPENAI_API_KEY);
  const openAIBaseURL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/g, "");

  if (!openAIKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // OpenRouter requires additional headers for authentication
  const isOpenRouter = openAIBaseURL.includes("openrouter");
  const openAIHeaders = {
    Authorization: `Bearer ${openAIKey}`,
    "Content-Type": "application/json",
    ...(isOpenRouter ? {
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "SmartResumeApp",
    } : {}),
  };

  console.log("🔐 Making request to:", openAIBaseURL);
  console.log("🔑 API Key starts with:", openAIKey.substring(0, 15) + "...");
  console.log("📋 Using headers:", Object.keys(openAIHeaders).join(", "));

  const url = `${openAIBaseURL}/chat/completions`;
  const response = await axios.post(
    url,
    {
      model,
      messages,
      temperature,
      max_tokens,
    },
    {
      headers: openAIHeaders,
    }
  );

  return response.data;
};

export const getOpenAIResponse = async (prompt) => {
  try {
    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: "You are a professional resume writer.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    return content.trim();
  } catch (error) {
    console.error("❌ OpenAI Resume Generation Error:", error.response?.data || error.message || error);
    throw new Error("AI resume generation failed");
  }
};

// ===============================
// 🔹 AI RESUME REVIEW (JSON)
// ===============================
export const getAIReview = async (resumeText) => {
  const openAIKey = process.env.OPENAI_API_KEY;
  console.log("🔑 API KEY:", openAIKey);
  const prompt = `
You are a senior recruiter and ATS (Applicant Tracking System) expert.

Analyze the resume VERY STRICTLY and provide DEEP, HONEST, and SPECIFIC feedback.

Do NOT give generic advice.
Give specific, actionable, and sometimes critical feedback.

Return ONLY valid JSON in this format:

{
  "summary": "3-4 line strong evaluation of candidate",
  "score": {
    "overall": number (0-10),
    "clarity": number (0-10),
    "relevance": number (0-10),
    "impact": number (0-10)
  },
  "pros": [
    "specific strengths with examples from resume"
  ],
  "cons": [
    "specific weaknesses with explanation"
  ],
  "suggestions": [
    "clear actionable improvements (with examples)"
  ],
  "details": [
    "detailed recruiter-level observations"
  ]
}

IMPORTANT RULES:
- Be critical like a real recruiter
- Mention missing metrics (numbers, impact)
- Point out weak project descriptions
- Suggest improvements with examples
- Avoid generic phrases like "good", "nice"
- Focus on job readiness

Resume:
"""
${resumeText}
"""
`;

  if (!openAIKey || openAIKey === "your-openai-api-key-here") {
    console.log("⚠️ OpenAI API key not configured, returning mock detailed feedback");
    return {
      summary: "The resume has a strong structure and clear work history but could use more measurable achievements and stronger keywords.",
      score: {
        overall: 7,
        clarity: 8,
        relevance: 6,
        impact: 6,
      },
      pros: [
        "Clear technical skills section",
        "Legible formatting and layout",
        "Relevant work experience included",
      ],
      cons: [
        "Lacks quantifiable metrics in achievements",
        "Could use more industry-specific keywords",
        "Education section is brief and could be expanded",
      ],
      suggestions: [
        "Add metrics like percentages, revenue impact, or team size",
        "Include keywords from target job descriptions",
        "Highlight recent certifications or training",
      ],
      details: [
        "The summary section is missing a concise career objective.",
        "Projects are described without measurable outcomes.",
        "The resume could better align technical skills to the target role.",
      ],
    };
  }

  try {
    const response = await createChatCompletion({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: "You are a strict and detail-oriented recruiter. Give blunt, honest, and specific feedback."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    let result = response.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error("Empty AI response");
    }

    result = result
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();

    console.log("🧠 Raw AI Response:\n", result);

    try {
      const parsed = JSON.parse(result);
      return {
        summary: parsed.summary || parsed.overview || "",
        score: parsed.score || (parsed.overallScore ? {
          overall: parsed.overallScore,
          clarity: parsed.clarity || 0,
          relevance: parsed.relevance || 0,
          impact: parsed.impact || 0,
        } : null),
        pros: parsed.pros || parsed.strengths || [],
        cons: parsed.cons || parsed.weaknesses || [],
        suggestions: parsed.suggestions || parsed.recommendations || [],
        details: parsed.details || parsed.analysis || [],
      };
    } catch (err) {
      console.error("❌ JSON Parse Error:", err);
      throw new Error("AI returned invalid JSON");
    }
  } catch (error) {
    console.error("❌ AI Review Error:", error.response?.data || error.message || error);
    return {
      summary: "Resume analysis could not be completed by the AI service.",
      score: {
        overall: 6,
        clarity: 6,
        relevance: 5,
        impact: 6,
      },
      pros: ["Resume uploaded successfully"],
      cons: ["AI review failed due to API authentication or network issues."],
      suggestions: ["Verify your OpenAI/OpenRouter API key and base URL."],
      details: [],
    };
  }
};
