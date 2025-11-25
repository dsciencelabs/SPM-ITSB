import { GoogleGenAI, Type } from "@google/genai";
import { AuditStandard, AuditQuestion, AuditSession } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

/**
 * Generates a specific checklist based on the accreditation standard.
 * Note: This is a Fallback. Primary data should come from MasterDataContext.
 */
export const generateChecklist = async (standard: AuditStandard, department: string): Promise<AuditQuestion[]> => {
  
  const prompt = `
    You are a Senior Quality Assurance Auditor for Higher Education in Indonesia.
    Generate a specialized Audit Checklist for a study program in the department of "${department}".
    The checklist must be strictly based on the "${standard}" accreditation framework.
    
    Generate exactly 5 high-impact, specific audit questions/indicators that are critical for this standard.
    Focus on "Outcome Based Education" (OBE) and recent quality trends.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "A unique short code for the question (e.g., C.1.a)" },
        category: { type: Type.STRING, description: "The criteria or standard dimension (e.g., Kurikulum, SDM, Sarana)" },
        questionText: { type: Type.STRING, description: "The specific audit question or indicator to check." },
      },
      required: ["id", "category", "questionText"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a helpful, professional, and strict academic auditor."
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Hydrate with default empty fields for the app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawData.map((item: any) => ({
      ...item,
      compliance: null,
      evidence: "",
      auditorNotes: ""
    }));

  } catch (error) {
    console.error("Error generating checklist:", error);
    throw new Error("Failed to generate audit checklist from Gemini.");
  }
};

/**
 * Analyzes the audit results and produces a report.
 */
export const generateAuditReport = async (audit: AuditSession): Promise<{ summary: string; recommendations: string[] }> => {
  
  // Filter relevant data to send to LLM to save tokens
  const auditContext = {
    standard: audit.standard,
    department: audit.department,
    findings: audit.questions.map(q => ({
      category: q.category,
      question: q.questionText,
      result: q.compliance,
      notes: q.auditorNotes,
      evidence: q.evidence
    }))
  };

  const prompt = `
    Analyze the following Internal Quality Audit (AMI) results for the "${audit.department}" department using standard "${audit.standard}".
    
    Data: ${JSON.stringify(auditContext)}
    
    Please provide:
    1. An executive summary of the audit performance (max 100 words).
    2. A list of 3 specific, actionable strategic recommendations to improve their accreditation score.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "Executive summary of findings." },
      recommendations: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of strategic recommendations." 
      }
    },
    required: ["summary", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use flash for speed on analysis
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      summary: result.summary || "No summary generated.",
      recommendations: result.recommendations || []
    };

  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to analyze audit results.");
  }
};