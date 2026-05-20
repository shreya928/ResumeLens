import fs from "fs";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Set worker to null to disable the need for worker in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = null;

export const extractTextFromPDF = async (filePath) => {
  try {
    console.log("📄 Extracting text from PDF:", filePath);
    const fileData = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str).join(" ");
      text += strings + "\n";
    }

    console.log("✅ PDF extraction successful");
    return text;
  } catch (err) {
    console.error("❌ PDF extraction failed:", err);
    throw err;
  }
};
