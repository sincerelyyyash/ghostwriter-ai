import { startServer } from "./app";
import { webSocketServer } from "./websocket";

try {
  startServer();
  webSocketServer();
} catch (error) {
  console.error("Error starting servers:", error);
  process.exit(1);
}

