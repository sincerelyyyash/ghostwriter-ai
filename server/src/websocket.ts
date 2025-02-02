import { WebSocketServer } from "ws";
import { chatbot } from "./controllers/gemini.controller";

export const webSocketServer = () => {
  const port = Number(process.env.WS_PORT) || 8080;
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
      try {
        const { userId, userMessage } = JSON.parse(message.toString());
        const response = await chatbot(userId, userMessage);
        ws.send(response);
      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  console.log(`WebSocket server running on port: ${port}`);
};


