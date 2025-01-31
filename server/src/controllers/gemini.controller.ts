import { SYSTEM_PROMPT } from "../utils/systemPrompt";
import { createLinkedinPost, deleteLinkedinPost, getAllLinkedinPosts, searchLinkedinPost, updateLinkedinPost } from "./linkedin.controller";
import { createTwitterPost, deleteTwitterPost, getAllTwitterPosts, searchTwitterPost, updateTwitterPost } from "./twitter.controller";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const tools: Record<string, Function> = {
  createTwitterPost,
  updateTwitterPost,
  deleteTwitterPost,
  searchTwitterPost,
  getAllTwitterPosts,
  createLinkedinPost,
  updateLinkedinPost,
  deleteLinkedinPost,
  searchLinkedinPost,
  getAllLinkedinPosts,
};

export const chatbot = async (userId: string, userMessage: string): Promise<string> => {
  console.log(`{ "type": "user", "user": "${userMessage}" }`);

  const prompt = `${SYSTEM_PROMPT("Full Stack Developer")}\nUser Request: "${userMessage}"`;
  const result = await model.generateContent(prompt);
  const aiResponse = result.response.text();

  console.log(`{ "type": "plan", "plan": "${aiResponse}" }`);

  const functionMatch = aiResponse.match(/function:\s*([\w]+)/);
  const inputMatch = aiResponse.match(/input:\s*"(.*?)"/);

  if (functionMatch && tools[functionMatch[1]]) {
    const functionName = functionMatch[1];
    const functionInput = inputMatch ? inputMatch[1] : "";

    console.log(`{ "type": "action", "function": "${functionName}", "input": "${functionInput}" }`);

    try {
      const observation = await tools[functionName](userId, functionInput);
      console.log(`{ "type": "observation", "observation": "${JSON.stringify(observation)}" }`);
      return `{ "type": "output", "output": "? ${functionName} executed successfully!" }`;
    } catch (error: any) {
      return `{ "type": "output", "output": "? Error executing ${functionName}: ${error.message}" }`;
    }
  } else {
    return `{ "type": "output", "output": "?? I didn't understand that request." }`;
  }
};

