import { createWorker } from "tesseract.js";

export async function validateDocumentWithOCR(file, requiredKeywords) {
  const worker = await createWorker();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  
  await worker.setParameters({
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",
    tessedit_pageseg_mode: "1",
    tessedit_ocr_engine_mode: "3",
  });

  try {
    // Convert file to image URL
    const imageUrl = URL.createObjectURL(file);
    
    // Perform OCR directly on the image
    const result = await worker.recognize(imageUrl);
    
    // Clean up
    URL.revokeObjectURL(imageUrl);
    
    const normalizedText = result.data.text
      .toLowerCase()
      .replace(/[\n\r]+/g, " ")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    console.log("Extracted text:", normalizedText); // For debugging

    const missingKeywords = requiredKeywords.filter((keyword) => {
      const normalizedKeyword = keyword
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "");
      
      console.log(`Checking for keyword: ${normalizedKeyword}`); // For debugging
      
      return (
        !normalizedText.includes(normalizedKeyword) &&
        levenshteinDistance(normalizedText, normalizedKeyword) > 2
      );
    });

    await worker.terminate();
    return {
      isValid: missingKeywords.length === 0,
      missingKeywords,
      text: normalizedText,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    await worker.terminate();
    throw error;
  }
}

// Document type keyword mappings
export const DocumentKeywords = {
  "Export License": ["export", "license"],
  "Certificate of Origin": ["certificate", "origin"],
  "Commercial Invoice": ["commercial", "invoice"],
  "Packing List": ["packing", "list"],
  "UN Packaging Specification": ["un", "packaging", "specification"],
  "Safety Data Sheet": ["safety", "data", "sheet"],
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill()
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[b.length][a.length];
}