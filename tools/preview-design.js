import z from "zod";
import { dataManagementClient } from "./common.js";
import { RESOURCE_URI } from "../config.js";

export const previewDesignTool = {
    name: "preview-design",
    config: {
        title: "Preview design",
        description: "Displays an interactive preview of the specified design.",
        inputSchema: {
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            designId: z.string().nonempty().describe("The ID of the design to preview.")
        },
        annotations: { readOnlyHint: true },
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI,
            },
        },
    },
    callback: async ({ projectId, designId }) => {
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const output = {
            name: tip.data.attributes.displayName,
            urn: tip.data.relationships.derivatives.data.id
        };
        return {
            structuredContent: output,
            content: [{
                type: "text",
                text: `Here's the preview of ${output.name}`
            }]
        };
    }
};
