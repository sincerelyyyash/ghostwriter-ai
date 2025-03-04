import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
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
import { SequentialChain, LLMChain } from "langchain/chains";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();

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

const chatModel = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-pro",
  apiKey: process.env.GEMINI_API_KEY!,
  temperature: 0.7,
});

const systemPrompt = new PromptTemplate({
  template: `You are a helpful AI assistant for a {role}. The user has sent the following message: {userMessage}`,
  inputVariables: ["role", "userMessage"],
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

const generateAIResponse = new LLMChain({
  llm: chatModel,
  prompt: systemPrompt,
});

const processAIResponse = async (aiResponse: string): Promise<Action[]> => {
  const jsonObjects = aiResponse
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const actions: Action[] = [];
  for (const jsonString of jsonObjects) {
    try {
      const action: Action = JSON.parse(jsonString);
      actions.push(action);
    } catch (error) {
      console.error("Invalid JSON object:", jsonString, error);
    }
  }
  return actions;
};

const executeFunction = async (action: Action) => {
  if (action.type === "action" && action.function) {
    const fn = tools[action.function];
    if (!fn) {
      console.error(`Invalid function call: ${action.function}`);
      return;
    }

    console.log(`Executing function: ${action.function} with input:`, action.input);
    return await fn(...Object.values(action.input));
  }
  return action.output;
};


export const chatbot = async (userId: string, userMessage: string): Promise<string> => {
  try {
    const query: Query = {
      type: "user",
      user: { userId, userMessage },
    };

    const chain = new SequentialChain({
      chains: [generateAIResponse],
      inputVariables: ["role", "userMessage"],
      outputVariables: ["aiResponse"],
    });

    const aiResponse = await chain.call({
      role: "Full Stack Developer",
      userMessage: JSON.stringify(query),
    });

    console.log("AI Response:", aiResponse.aiResponse);

    const actions = await processAIResponse(aiResponse.aiResponse);
    let finalResponse = "";

    for (const action of actions) {
      const result = await executeFunction(action);
      finalResponse += result + "\n";
    }

    return finalResponse.trim() || "I'm not sure how to respond.";
  } catch (error) {
    console.error("Error processing message:", error);
    return "An error occurred while processing your request.";
  }
};

