import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateChatResponse = async (
  message: string,
  history: { role: string; content: string }[] = []
) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Lumina, a highly intelligent and helpful AI assistant. Provide clear, detailed, and accurate responses. When providing code, ensure it is well-formatted. You are designed to be easy to copy-paste into GitHub, so use clean Markdown structure.",
    },
  });

  // We don't use the built-in history directly because we manage it in our DB
  // But we can pass the last few messages if needed. For now, we'll just send the message.
  // To support true history in the session:
  // const chat = ai.chats.create({ model: "...", history: history.map(...) });
  
  const response: GenerateContentResponse = await chat.sendMessage({ message });
  return response.text;
};

export const generateTitle = async (message: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a very short, 2-4 word title for a chat that starts with this message: "${message}". Return only the title text.`,
  });
  return response.text?.replace(/["']/g, "").trim() || "New Chat";
};
