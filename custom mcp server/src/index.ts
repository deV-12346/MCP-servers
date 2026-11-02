import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createBookingHandler } from "./handlers/createBooking.handler.js";
import { seachPackagesHandler } from "./handlers/seachPackages.handler.js";
import { getTripWeather } from "./services/openmeteo.js";

const server = new McpServer({
  name: "travel-mcp-server",
  version: "1.0.0",
});

// Helper function to format responses correctly for MCP
const reply = (data: any) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

// 2. Tool 1: search_package
server.tool(
  "search_package",
  "Search the database for travel packages in Himachal Pradesh. ALWAYS use this tool when the user asks about packages, costs, destination pricing, or trip durations.",
  {
    destinationName: z
      .string()
      .describe("Destination to search, such as Manali or Shimla"),
    packageName: z
      .string()
      .optional()
      .describe("Optional name or type of the package"),
    maxBudget: z
      .number()
      .optional()
      .describe("Optional maximum total budget in INR"),
  },
  async (args) => {
    return reply(await seachPackagesHandler(args));
  },
);
server.tool(
  "create_booking",
  "Book a travel package for the user. Call this as soon as you know the package name and the start date.",
  {
    packageName: z.string().describe("The name of the package to book"),
    startDate: z.string().describe("Trip start date (YYYY-MM-DD)"),
  },
  async (args) => {
    return reply(createBookingHandler);
  },
);
server.registerTool(
  "get_destination_weather",
  {
    title: "Destination weather forecast",
    description:
      "Get the daily weather forecast (temperature, rain, snow, warnings) for a destination in India for the trip dates. " +
      "Use it when the user asks about weather, or before suggesting dates for hill destinations. Forecast is available up to 16 days ahead.",
    inputSchema: {
      city: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .describe("Destination, e.g. Manali, Shimla, Kasol"),
      startDate: z.iso.date().describe("Trip start date, YYYY-MM-DD"),
      days: z
        .number()
        .int()
        .min(1)
        .max(7)
        .default(3)
        .describe("Number of trip days (1-7)"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
    async (args, extra) => {
    const started = Date.now();
    console.error("[weather] args:", JSON.stringify(args));
    try {
      const signal = AbortSignal.any([extra.signal, AbortSignal.timeout(15_000)]);
      const result = await getTripWeather(args, signal);
      console.error(`[weather] ok in ${Date.now() - started} ms`);
      return reply(result);
    } catch (err) {
      console.error(`[weather] FAILED after ${Date.now() - started} ms`, "| cancelled by client:", extra.signal.aborted, "|", err);
      throw err;
    }
  },
);
// 4. Server Start via Stdio Transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Travel MCP Server is running and listening on stdio...");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
