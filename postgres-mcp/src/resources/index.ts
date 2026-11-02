import { registerStoreInfo } from "./store-info.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export const registerAllResources = (server:McpServer) =>{
    registerStoreInfo(server)
}