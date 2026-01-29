import z from "zod";
import { dataManagementClient } from "./common.js";
import { RESOURCE_URI } from "../config.js";

export const previewDesignTool = {
    name: "preview-design",
    config: {
        title: "Preview design",
        description: "Displays a 3D preview of the specified design within an embedded viewer.",
        inputSchema: {
            projectId: z.string().nonempty(),
            designId: z.string().nonempty()
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
        console.log("Previewing design:", output);
        return {
            structuredContent: output,
            content: [{
                type: "text",
                text: `Here's the preview of ${output.name}`
            }]
        };
    }
};
