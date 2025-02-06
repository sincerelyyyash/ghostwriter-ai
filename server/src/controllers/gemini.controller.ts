import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
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
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT("Full stack Developer") },
  ];

  let iterationCount = 0;
  const maxIterations = 10;

  while (iterationCount < maxIterations) {
    iterationCount++;

    const query: Query = {
      type: "user",
      user: { userId, userMessage },
    };

    messages.push({ role: 'user', content: JSON.stringify(query) });

    try {
      const contentArray: string[] = messages.map(msg => msg.content);

      const result = await model.generateContent(contentArray);
      console.log(result);

      const responseText = await result.response.text();
      // console.log("Raw response text:", responseText); // Log the raw response text for debugging

      const jsonObjects = responseText
        .split('\n') // Split by newlines
        .map((line) => line.trim()) // Remove extra spaces
        .filter((line) => line.length > 0); // Remove empty lines

      for (const jsonString of jsonObjects) {
        try {
          const action: Action = JSON.parse(jsonString);
          console.log("Parsed action:", action);

          messages.push({ role: 'assistant', content: jsonString });

          if (action.type === 'output') {
            console.log(action.output);
          } else if (action.type === 'action' && action.function) {
            const fn = tools[action.function];
            if (!fn) throw new Error('Invalid function call');

            console.log("Input:", Object.values(action.input).join(", "));
            const fnInput = Object.values(action.input).join(", ")
            const observation = await fn(...Object.values(action.input));
            const observationMessages = {
              type: 'observation',
              observation: observation,
            };
            messages.push({ role: 'developer', content: JSON.stringify(observationMessages) });
          }
        } catch (jsonError) {
          console.error("Invalid JSON object:", jsonString);
          console.error("JSON parsing error:", jsonError);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);

      if (error instanceof GoogleGenerativeAIFetchError && error.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error("Unhandled error:", error);
        break;
      }
    }
  }

  if (iterationCount >= maxIterations) {
    console.error("Maximum iterations reached. Exiting chatbot.");
  }
};
