import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { callbackHandler } from "./auth.js";
import { PORT, ALLOWED_HOSTS } from "./config.js";
import * as tools from "./tools/index.js";
import * as resources from "./resources/index.js";

function createMcpServer() {
    const server = new McpServer({
        name: "My MCP App Server",
        version: "0.0.1",
    });
    Object.values(tools).forEach(register => register(server));
    Object.values(resources).forEach(register => register(server));
    return server;
}

const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: ALLOWED_HOSTS,
});
app.use(cors({
    exposedHeaders: ["WWW-Authenticate", "Mcp-Session-Id", "Last-Event-Id", "Mcp-Protocol-Version"],
    origin: "*", // WARNING: This allows all origins to access the MCP server. In production, you should restrict this to specific origins.
}));
app.get("/auth/callback", callbackHandler);

const _transports = new Map(); // Map to store transports by session ID

app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    try {
        let transport;
        if (sessionId && _transports.has(sessionId)) {
            // Existing session - use the associated transport
            transport = _transports.get(sessionId);
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // New session initialization - create a new transport and associate it with the new session ID
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => uuidv4(),
                onsessioninitialized: sessionId => {
                    console.debug(`Session initialized with ID: ${sessionId}`);
                    _transports.set(sessionId, transport);
                },
            });
            transport.onclose = () => {
                const { sessionId } = transport;
                if (sessionId && _transports.has(sessionId)) {
                    console.debug(`Transport closed for session ${sessionId}, removing from transports map`);
                    _transports.delete(sessionId);
                }
            };
            const server = createMcpServer();
            await server.connect(transport);
        } else {
            res.status(400).json({
                jsonrpc: "2.0",
                error: {
                    code: -32000,
                    message: "Bad Request: No valid session ID provided"
                },
                id: null
            });
            return;
        }

        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Internal server error"
                },
                id: null
            });
        }
    }
});

app.listen(PORT, (err) => {
    if (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
    console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
});
