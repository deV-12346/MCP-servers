import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOrderSchema } from "../schema/getOrders.schema.js";
import { getUserOrder } from "../services/userOrder.js";

export const getOrder = ( server:McpServer)=>{
    server.registerTool(
  "get-order",
  {
    title: "Get Orders",
    description: "Fetch orders for a customer, optionally filtered by status",
    inputSchema: getOrderSchema,
  },
   async (args,extra) => {
      try {
        const orders = await getUserOrder(args,extra);
        return {
          content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
        };
      } catch (err) {
        console.error("Detailed DB Error:", err);
        return {
          isError: true,
          content: [
            {
              err,
              type: "text",
              text: `${err} Failed to fetch orders: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    }
  );
}