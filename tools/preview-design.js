import z from "zod";
import { dataManagementClient } from "./common.js";
import { getServiceAccountAccessToken } from "../auth.js";
import { VIEWER_RESOURCE_URI } from "../resources/viewer.js";

export const previewDesignToolFactory = ({ derivativeFormat }) => ({
    name: "preview-design",
    config: {
        title: "Preview design",
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
    },
    callback: async ({ projectId, designId, region = "US" }) => {
        const credentials = await getServiceAccountAccessToken(["viewables:read"]);
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const output = {
            name: tip.data.attributes.displayName,
            urn: tip.data.relationships.derivatives.data.id,
            config: {
                accessToken: credentials.access_token,
            }
        };
        switch (derivativeFormat) {
            case "fallback":
                output.config.env = "AutodeskProduction";
                output.config.api = region === "US" ? "derivativeV2" : `derivativeV2_${region}`; // TODO: not sure if the viewer supports other regions yet
                break;
            case "latest":
                output.config.env = "AutodeskProduction2";
                output.config.api = region === "US" ? "streamingV2" : `streamingV2_${region}`; // TODO: not sure if the viewer supports other regions yet
                break;
        }
        return {
            structuredContent: output,
            content: [{
                type: "text",
                text: `Here's the preview of ${output.name}`
            }]
        };
    }
});
