import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://http-mcpserver.onrender.com/mcp")
);

const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

console.log("Connecting to server...");
await client.connect(transport);
console.log("Connected to server");
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: "calculate-bmi",
  arguments: {
    weightKg: 70,
    heightM: 1.75,
  },
});
console.log(result);
