import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllResources } from "./resources/index.js";
import { registerAllPrompt } from "./prompt/index.js";
import { registerAllTools } from "./tools/index.js";
export const startServer = () => {
  const server = new McpServer({
    name: "custom-mcp-server",
    version: "1.0.0",
  });
  registerAllResources(server)
  registerAllPrompt(server)
  registerAllTools(server)
  return server
};
