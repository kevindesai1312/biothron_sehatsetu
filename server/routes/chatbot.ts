import { RequestHandler } from "express";
import type { ChatRequest, ChatResponse } from "@shared/api";
import { generateAIContent } from "../services/ai";

export const handleChatRequest: RequestHandler = async (req, res) => {
  try {
    const { messages, language = "en" } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const langInstruction = language === "hi" 
      ? "You must respond ONLY in Hindi. Do not use English."
      : "You must respond in English.";

    const systemPrompt = `You are an empathetic, highly knowledgeable medical assistant for the "Sehat Setu" application (meaning Health Bridge). Your goal is to help users with their health queries, guide them on preventive care, and provide general medical information.
IMPORTANT RULES:
1. Be polite, professional, and empathetic.
2. Provide concise and clear answers.
3. If asked about a serious medical emergency, strongly advise the user to seek immediate professional medical help or visit the nearest hospital.
4. ${langInstruction}
`;

    // Format history for Gemini API
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as the Sehat Setu medical assistant and follow these instructions." }],
      },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))
    ];

    const result = await generateAIContent(contents);
    const response = await result.response;
    const text = response.text();

    const chatResponse: ChatResponse = {
      reply: text,
    };

    res.json(chatResponse);
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to process chat request." });
  }
};
