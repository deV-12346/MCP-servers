import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSummarizeOrders } from "./summarize.js";

export const registerAllPrompt = (server: McpServer) =>{
       registerSummarizeOrders(server)
}