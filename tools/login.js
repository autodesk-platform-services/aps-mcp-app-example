import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { generateAuthorizationUrl } from "../auth.js";

export const register = (/** @type import("@modelcontextprotocol/sdk/server/mcp.js").McpServer */ server) => registerAppTool(server, "login", {
    title: "Login",
    description: "Initiates the login process for Autodesk Construction Cloud (ACC).",
    annotations: { readOnlyHint: true },
    _meta: {},
}, async (extra) => {
    const authUrl = generateAuthorizationUrl(extra.sessionId);
    // server.server.elicitInput({
    //     mode: "url",
    //     url: authUrl,
    //     message: "Please authenticate with Autodesk Construction Cloud (ACC) to continue.",
    // });
    return {
        content: [{
            type: "text",
            text: `Please [click here](${authUrl}) to authenticate with Autodesk Construction Cloud (ACC).`
        }]
    };
});
