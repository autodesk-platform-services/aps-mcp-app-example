import * as z from "zod";
import { dataManagementClient } from "./common.js";
import { getServiceAccountAccessToken } from "../auth.js";
import { VIEWER_RESOURCE_URI } from "../resources/viewer.js";

export const previewDesignToolFactory = () => ({
    name: "preview-design",
    config: {
        title: "Preview design",
        description: "Displays an interactive preview of the specified design. While the preview is open, the viewer exposes its own tools for selecting (`select`), isolating (`isolate`), and coloring (`color`) design elements by their IDs (dbIds). Elements selected by the user are reported back automatically.",
        inputSchema: z.object({
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            region: z.string().optional().describe("The region of the project the design belongs to. If not provided, the US region will be used."),
            designId: z.string().nonempty().describe("The ID of the design to preview."),
        }),
        annotations: { readOnlyHint: true },
        _meta: {
            ui: {
                resourceUri: VIEWER_RESOURCE_URI,
            },
        },
    },
    callback: async ({ projectId, designId, region = "US" }) => {
        const [tip, credentials] = await Promise.all([
            dataManagementClient.getItemTip(projectId, designId),
            getServiceAccountAccessToken(["viewables:read"]),
        ]);
        const output = {
            name: tip.data.attributes.displayName,
            urn: tip.data.relationships.derivatives.data.id,
            config: {
                env: "AutodeskProduction2",
                api: region === "US" ? "streamingV2" : `streamingV2_${region}`, // TODO: not sure if the viewer supports other regions yet
            },
            // The viewer prefers fetching tokens via the app-only get-viewer-token tool (which also handles refreshes).
            // This token is only used as a fallback for hosts that don't support calling server tools from the app.
            fallbackToken: {
                accessToken: credentials.access_token,
                expiresIn: credentials.expires_in,
            },
        };
        return {
            structuredContent: output,
            content: [{
                type: "text",
                text: `Here's the preview of ${output.name}`
            }]
        };
    }
});
