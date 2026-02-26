import z from "zod";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { DataManagementClient } from "@aps_sdk/data-management";
import { VIEWER_RESOURCE_URI } from "../resources/viewer.js";
import { getAccessToken } from "../auth.js";

export const register = (server) => registerAppTool(server, "preview-design", {
    title: "Preview Design",
    description: "Displays an interactive preview of the specified design.",
    inputSchema: {
        projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
        region: z.string().optional().describe("The region of the project the design belongs to. If not provided, the US region will be used."),
        designId: z.string().nonempty().describe("The ID of the design to preview."),
    },
    annotations: { readOnlyHint: true },
    _meta: {
        ui: {
            resourceUri: VIEWER_RESOURCE_URI,
        },
    },
}, async ({ projectId, designId, region = "US" }, extra) => {
    const dataManagementClient = new DataManagementClient();
    const accessToken = await getAccessToken(extra.sessionId);
    const tip = await dataManagementClient.getItemTip(projectId, designId, { accessToken });
    const output = {
        name: tip.data.attributes.displayName,
        urn: tip.data.relationships.derivatives.data.id,
        config: {
            accessToken,
            env: "AutodeskProduction2",
            api: region === "US" ? "streamingV2" : `streamingV2_${region}`,
        }
    };
    return {
        structuredContent: output,
        content: [{
            type: "text",
            text: JSON.stringify(output, null, 2) // Some clients may not support rendering structured content, so we include a text representation as well
        }]
    };
});
