import { SYSTEM_PROMPT } from "../utils/systemPrompt";
import {
  createLinkedinPost,
  deleteLinkedinPost,
  getAllLinkedinPosts,
  searchLinkedinPost,
  updateLinkedinPost
} from "./linkedin.controller";
import {
  createTwitterPost,
  deleteTwitterPost,
  getAllTwitterPosts,
  searchTwitterPost,
  updateTwitterPost
} from "./twitter.controller";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

interface Query {
  type: string;
  user: {
    userId: string;
    userMessage: string;
  };
}

interface Action {
  type: string;
  function?: string;
  input?: any;
  output?: string;
}

const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

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

export const chatbot = async (userId: string, userMessage: string): Promise<void> => {
  console.log(`{ "type": "user", "user": "${userMessage}" }`);

  const query: Query = {
    type: "user",
    user: { userId, userMessage },
  };

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT("Full stack Developer") },
    { role: 'user', content: JSON.stringify(query) }
  ];

  try {
    const contentArray: string[] = messages.map(msg => msg.content);
    const result = await model.generateContent(contentArray);

    const responseText = result.response.text();
    console.log("AI Response:", responseText);

    const jsonObjects = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const jsonString of jsonObjects) {
      try {
        const action: Action = JSON.parse(jsonString);
        console.log("Parsed action:", action);

        if (action.type === 'output' && action.output) {
          console.log("AI Output:", action.output);
          return;
        }

        if (action.type === 'action' && action.function) {
          const fn = tools[action.function];
          if (!fn) {
            console.error(`Invalid function call: ${action.function}`);
            return;
          }

          console.log(`Executing function: ${action.function} with input:`, action.input);
          const observation = await fn(...Object.values(action.input));

          console.log("Function Execution Result:", observation);

          const observationMessages = {
            type: 'observation',
            observation,
          };
          messages.push({ role: 'developer', content: JSON.stringify(observationMessages) });

          const finalResult = await model.generateContent(messages.map(msg => msg.content));
          const finalResponseText = finalResult.response.text();
          console.log("Final AI Response after function execution:", finalResponseText);
          return;
        }
      } catch (jsonError) {
        console.error("Invalid JSON object:", jsonString);
        console.error("JSON parsing error:", jsonError);
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);

    if (error instanceof GoogleGenerativeAIFetchError && error.status === 429) {
      console.log("Rate limit exceeded, retrying in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.error("Unhandled error:", error);
    }
  }
};

