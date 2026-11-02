import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerStoreInfo(server: McpServer) {
  server.registerResource(
    "store-info",
    "store://info",
    {
      title: "Store Info",
      description: "Return policy, shipping details aur support contact",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({
            returnWindowDays: 7,
            shipping: "3-5 business days",
            support: "support@example.com",
          }),
        },
      ],
    })
  );
}