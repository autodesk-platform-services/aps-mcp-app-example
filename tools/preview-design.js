import z from "zod";
import { dataManagementClient } from "./common.js";
import { getServiceAccountAccessToken } from "../auth.js";
import { RESOURCE_URI, APS_REGION, DERIVATIVE_FORMAT } from "../config.js";

export const previewDesignTool = {
    name: "preview-design",
    config: {
        title: "Preview design",
        description: "Displays an interactive preview of the specified design.",
        inputSchema: {
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            designId: z.string().nonempty().describe("The ID of the design to preview."),
        },
        annotations: { readOnlyHint: true },
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI,
            },
        },
    },
    callback: async ({ projectId, designId }) => {
        const credentials = await getServiceAccountAccessToken(["viewables:read"]);
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const output = {
            name: tip.data.attributes.displayName,
            urn: tip.data.relationships.derivatives.data.id,
            config: {
                accessToken: credentials.access_token,
            }
        };
        switch (DERIVATIVE_FORMAT) {
            case "fallback":
                output.config.env = "AutodeskProduction";
                output.config.api = APS_REGION === "US" ? "derivativeV2" : `derivativeV2_${APS_REGION}`; // TODO: not sure if the viewer supports other regions yet
                break;
            case "latest":
                output.config.env = "AutodeskProduction2";
                output.config.api = APS_REGION === "US" ? "streamingV2" : `streamingV2_${APS_REGION}`; // TODO: not sure if the viewer supports other regions yet
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
};
