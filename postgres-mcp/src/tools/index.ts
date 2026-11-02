import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getOrder } from "./getOrder.js"

export const registerAllTools = (server:McpServer) =>{
    getOrder(server)
}