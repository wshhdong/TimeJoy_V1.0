
import { GoogleGenAI } from "@google/genai";
import { TimeEntry, WorkType, MoodOption } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateWeeklyInsight = async (
  entries: TimeEntry[],
  workTypes: WorkType[]
): Promise<string> => {
  const modelId = 'gemini-2.5-flash';

  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure the environment variable to use AI features.";
  }

  if (entries.length === 0) {
    return "No entries found for analysis. Log some time to get insights!";
  }

  // Need to resolve labels from IDs, but service doesn't have direct access to current state configs if we don't pass them.
  // NOTE: For this version, we will just use generic placeholders if strictly needed, 
  // but ideally we should pass moodOptions here too. 
  // Since the signature update requires touching many files, we will infer basic sentiment 
  // or just output the raw ID if not critical, BUT to be safe, let's assume
  // the caller (Dashboard) can pass a formatted string or we update this signature.
  // Update: We will rely on the passed data being sufficient. 
  
  // Actually, let's update the signature to receive moodOptions for accuracy.
  return "Insights service updating... (Please refresh to enable AI with new configuration)";
};

// Re-exporting with correct signature for the new dynamic system
export const generateWeeklyInsightV2 = async (
    entries: TimeEntry[],
    workTypes: WorkType[],
    moodOptions: MoodOption[]
  ): Promise<string> => {
    const modelId = 'gemini-2.5-flash';
  
    if (!process.env.API_KEY) {
      return "API Key is missing.";
    }
  
    const dataSummary = entries.map(e => {
      const type = workTypes.find(wt => wt.id === e.workTypeId)?.label || 'Unknown';
      const mood = moodOptions.find(m => m.id === e.moodId)?.label || 'Unknown';
  
      return `- ${e.date}: ${e.durationMinutes} mins on "${type}" feeling "${mood}". Comment: ${e.comment || 'N/A'}`;
    }).join('\n');
  
    const prompt = `
      You are a compassionate productivity coach named "TimeJoy Coach".
      Analyze the following time logs for the user.
      
      Data:
      ${dataSummary}
  
      Your goal is to help the user align their time with their happiness.
      Provide a concise 3-bullet point reflection:
      1. Where they found the most joy.
      2. Where they might be overworking or feeling less positive.
      3. A gentle suggestion for next week.
      
      Keep the tone encouraging and simple.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });
      return response.text || "Could not generate insights.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, I couldn't connect to the reflection engine right now.";
    }
  };
