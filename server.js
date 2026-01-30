import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { PORT, ALLOWED_HOSTS } from "./config.js";
import * as tools from "./tools/index.js";
import * as resources from "./resources/index.js";

function createMcpServer(options) {
    const server = new McpServer({
        name: "My MCP App Server",
        version: "0.0.1",
    });
    for (const toolFactory of Object.values(tools)) {
        const { name, config, callback } = toolFactory(options);
        registerAppTool(server, name, config, callback);
    }
    for (const resourceFactory of Object.values(resources)) {
        const { name, uri, config, callback } = resourceFactory(options);
        registerAppResource(server, name, uri, config, callback);
    }
    return server;
}

const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: ALLOWED_HOSTS,
});
app.use(cors());
app.all("/mcp", async (req, res) => {
    const options = {
        derivativeFormat: req.query.format === "svf2" ? "latest" : "fallback",
    };
    const server = createMcpServer(options);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
        transport.close().catch(() => { });
        server.close().catch(() => { });
    });

    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("MCP error:", error);
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

app.listen(PORT, (err) => {
    if (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
    console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
});
