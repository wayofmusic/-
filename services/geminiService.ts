import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { WorkoutSession, AIAnalysisResult } from '../types';

// Initialize the client directly using the environment variable as per guidelines.
// We assume process.env.API_KEY is available and valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWorkouts = async (sessions: WorkoutSession[]): Promise<AIAnalysisResult> => {
  if (sessions.length === 0) {
    return {
      summary: "还没有足够的运动数据。",
      advice: "开始你的第一次运动吧！",
      encouragement: "千里之行，始于足下。"
    };
  }

  // Filter last 10 sessions to keep context manageable
  const recentSessions = sessions.slice(0, 10).map(s => ({
    date: new Date(s.date).toLocaleDateString('zh-CN'),
    type: s.type,
    duration: Math.floor(s.totalTime / 1000) + 's',
    laps: s.laps.length
  }));

  const prompt = `
    作为一名专业的私人健身教练，请根据以下用户最近的运动记录进行分析。
    
    用户数据:
    ${JSON.stringify(recentSessions, null, 2)}
    
    请用 JSON 格式返回，包含以下三个字段：
    1. summary (字符串): 对近期运动表现的简短总结 (50字以内)。
    2. advice (字符串): 基于数据给出的具体改进建议 (100字以内)。
    3. encouragement (字符串): 一句激励人心的话。
    
    请使用中文回答。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            advice: { type: Type.STRING },
            encouragement: { type: Type.STRING },
          },
          required: ["summary", "advice", "encouragement"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("无法连接到 AI 教练，请稍后再试。");
  }
};