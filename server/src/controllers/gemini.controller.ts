import { SYSTEM_PROMPT } from "../utils/systemPrompt";
import { createLinkedinPost, deleteLinkedinPost, getAllLinkedinPosts, searchLinkedinPost, updateLinkedinPost } from "./linkedin.controller";
import { createTwitterPost, deleteTwitterPost, getAllTwitterPosts, searchTwitterPost, updateTwitterPost } from "./twitter.controller";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY as string;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required and was not found in environment variables.");
}

SYSTEM_PROMPT("Full Stack Developer");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const tools: Record<string, Function> = {
  createTwitterPost: createTwitterPost,
  updateTwitterPost: updateTwitterPost,
  deleteTwitterPost: deleteTwitterPost,
  searchTwitterPost: searchTwitterPost,
  getAllTwitterPost: getAllTwitterPosts,
  createLinkedinPost: createLinkedinPost,
  updateLinkedinPost: updateLinkedinPost,
  deleteLinkedinPost: deleteLinkedinPost,
  searchLinkedinPost: searchLinkedinPost,
  getAllLinkedInPosts: getAllLinkedinPosts,
};

export const chatbot = async (userId: string, userMessage: string) => {
  console.log(`{ "type": "user", "user": "${userMessage}" }`);

  const prompt = `${SYSTEM_PROMPT}\nUser Request: "${userMessage}"`;

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    console.log(`{ "type": "plan", "plan": "${aiResponse}" }`);

    const functionMatch = aiResponse.match(/function:\s*([\w]+)/);
    const inputMatch = aiResponse.match(/input:\s*"(.*?)"/);

    if (!functionMatch || !tools[functionMatch[1]]) {
      return `{ "type": "output", "output": "?? I didn't understand that request." }`;
    }

    const functionName = functionMatch[1];
    const functionInput = inputMatch ? inputMatch[1] : "";

    console.log(`{ "type": "action", "function": "${functionName}", "input": "${functionInput}" }`);

    const observation = await tools[functionName](userId, functionInput);
    console.log(`{ "type": "observation", "observation": "${JSON.stringify(observation)}" }`);

    return `{ "type": "output", "output": "? ${functionName} executed successfully!" }`;
  } catch (error: any) {
    return `{ "type": "output", "output": "? Error executing chatbot logic: ${error.message}" }`;
  }
};

