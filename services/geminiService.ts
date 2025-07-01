
import { GoogleGenAI } from "@google/genai";
import { Claim, AIAnalysis } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

const parseJsonResponse = (jsonStr: string): AIAnalysis | null => {
    let cleanJsonStr = jsonStr.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanJsonStr.match(fenceRegex);
    if (match && match[2]) {
        cleanJsonStr = match[2].trim();
    }
    try {
        const parsedData = JSON.parse(cleanJsonStr);
        // Basic validation of the parsed object structure
        if (parsedData.validationErrors && parsedData.riskLevel && parsedData.suggestedWorkflow) {
           return parsedData as AIAnalysis;
        }
        console.error("Parsed JSON does not match expected AIAnalysis structure:", parsedData);
        return null;
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Original string was:", jsonStr);
        return null;
    }
};

export const analyzeClaimWithAI = async (claim: Claim): Promise<AIAnalysis | null> => {
  try {
    const prompt = `
      System Instruction: You are an expert AI assistant for Robotic Process Automation (RPA) in medical claims processing. Your task is to analyze a single medical claim provided in JSON format and return a structured JSON object with your analysis.

      Claim Data:
      ${JSON.stringify(claim, null, 2)}

      Based on the claim data, perform the following actions:
      1.  **Data Validation:** Identify any missing or incorrectly formatted fields. For example, if status is 'Approved', 'approval_date' must be present. 'date_of_service', 'submitted_date', and 'approval_date' should be valid dates. Return an empty array if no errors.
      2.  **Risk Assessment:** Classify the claim's risk level as 'Low', 'Medium', or 'High'. High-risk claims could be those with very high 'claim_amount' (e.g., > 10000) or complex 'procedure_code's (e.g., related to surgery, denoted by CPT codes like 10000-69999).
      3.  **Workflow Assignment:** Suggest a department for review. Examples: 'Auto-Approval', 'Standard Review', 'Surgical Claims Audit', 'High-Value Claim Review'.

      Respond ONLY with a single, valid JSON object in the following format. Do not include any other text, explanations, or markdown fences.

      {
        "validationErrors": ["Error message 1 if any", "Error message 2 if any"],
        "riskLevel": "Low | Medium | High",
        "suggestedWorkflow": "Suggested Department"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const analysis = parseJsonResponse(response.text);
    return analysis;

  } catch (error) {
    console.error('Error analyzing claim with AI:', error);
    return {
        validationErrors: ['AI analysis failed.'],
        riskLevel: 'High',
        suggestedWorkflow: 'Manual Review Required'
    };
  }
};
