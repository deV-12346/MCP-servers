import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerSummarizeOrders(server: McpServer) {
  server.registerPrompt(
    "summarize-orders",
    {
      title: "Summarize Orders",
      description: "make a summary of user orders",
      argsSchema: {
        customerId: z.string().describe("Customer ID"),
      },
    },
    ({ customerId }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Use the get-orders tool to fetch all orders for customer ${customerId}, then summarize: total orders, total spend, and any pending or cancelled orders.`,
          },
        },
      ],
    })
  );
}