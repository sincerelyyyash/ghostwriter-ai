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

  const functionExecutionMatch = aiResponse.match(/Function Execution:\s*(.*?)(?=\n|$)/);

  if (functionExecutionMatch && functionExecutionMatch[1].toLowerCase().includes("function needed")) {
    const functionMatch = aiResponse.match(/function:\s*([\w]+)/);
    const inputMatch = aiResponse.match(/input:\s*"(.*?)"/);

    if (functionMatch && tools[functionMatch[1]]) {
      const functionName = functionMatch[1];
      const functionInput = inputMatch ? inputMatch[1] : "";

      console.log(`{ "type": "action", "function": "${functionName}", "input": "${functionInput}" }`);

      try {
        const observation = await tools[functionName](userId, functionInput);

        console.log(`{ "type": "observation", "observation": "${JSON.stringify(observation)}" }`);

        const responsePrompt = `${aiResponse}\nObservation: ${JSON.stringify(observation)}\nGenerate a response based on the above.`;
        const finalAIResponse = await model.generateContent(responsePrompt);
        return finalAIResponse.response.text();
      } catch (error: any) {
        const errorPrompt = `${aiResponse}\nError: ${error.message}\nGenerate a response based on the above.`;
        const finalAIResponse = await model.generateContent(errorPrompt);
        return finalAIResponse.response.text();
      }
    } else {
      return aiResponse;
    }
  } else {
    return aiResponse;
  }
};

