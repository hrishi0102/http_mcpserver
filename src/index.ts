import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Helper function to create a new server instance (for stateless mode)
function createServer() {
  const server = new McpServer(
    {
      name: "bmi-calculator-server",
      version: "1.0.0",
    },
    { capabilities: { logging: {} } }
  );

  // Register BMI calculator tool
  server.registerTool(
    "calculate-bmi",
    {
      title: "BMI Calculator",
      description: "Calculate Body Mass Index",
      inputSchema: {
        weightKg: z.number(),
        heightM: z.number(),
      },
    },
    async ({ weightKg, heightM }) => ({
      content: [
        {
          type: "text",
          text: String(weightKg / (heightM * heightM)),
        },
      ],
    })
  );

  return server;
}

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Stateless MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    // Create a new server and transport instance for each request (stateless)
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // No session management
    });

    // Clean up when request closes
    res.on("close", () => {
      console.log("Request closed, closing transport and server");
      transport.close();
      server.close();
    });

    // Connect server to transport
    await server.connect(transport);
    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Mode: STATELESS (new instance per request)`);
});
