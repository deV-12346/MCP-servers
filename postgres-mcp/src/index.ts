import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startServer } from "./server.js";
import dotenv from "dotenv";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
dotenv.config();
const app = express();
app.use(express.json());
app.post("/mcp", async (req,res) => {
  console.log("req received .....");
  const transport = new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  const server = startServer();
  await server.connect(transport);
  await transport.handleRequest(req,res,req.body)
});
app.listen(3000, () => {
  console.log("E-commerce MCP Server is running and listening on 6000");
});
// export const  connectServer = async()=>{
//     const transport = new StdioServerTransport()
//     const server = startServer()
//     await  server.connect(transport)
//     console.error("E-commerce MCP Server is running and listening on stdio...")
// }
// connectServer()
