"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const zod_1 = require("zod");
// Helper function to create a new server instance (for stateless mode)
function createServer() {
    const server = new mcp_js_1.McpServer({
        name: "bmi-calculator-server",
        version: "1.0.0",
    });
    // Register BMI calculator tool
    server.registerTool("calculate-bmi", {
        title: "BMI Calculator",
        description: "Calculate Body Mass Index",
        inputSchema: {
            weightKg: zod_1.z.number(),
            heightM: zod_1.z.number(),
        },
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ weightKg, heightM }) {
        return ({
            content: [
                {
                    type: "text",
                    text: String(weightKg / (heightM * heightM)),
                },
            ],
        });
    }));
    return server;
}
// Create Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
});
// Stateless MCP endpoint
app.post("/mcp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create a new server and transport instance for each request (stateless)
        const server = createServer();
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // No session management
        });
        // Clean up when request closes
        res.on("close", () => {
            console.log("Request closed");
            transport.close();
            server.close();
        });
        // Connect server to transport
        yield server.connect(transport);
        // Handle the request
        yield transport.handleRequest(req, res, req.body);
    }
    catch (error) {
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
}));
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Mode: STATELESS (new instance per request)`);
});
