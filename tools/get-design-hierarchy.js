import z from "zod";
import { dataManagementClient, modelDerivativeClient } from "./common.js";

export const getDesignHierarchyTool = {
    name: "get-design-hierarchy",
    config: {
        title: "Get design hierarchy",
        description: "Retrieves the hierarchical structure of elements within the specified design.",
        inputSchema: {
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            designId: z.string().nonempty().describe("The ID of the design to get hierarchy for.")
        },
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({ projectId, designId }) => {
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const urn = tip.data.relationships.derivatives.data.id;
        const views = await modelDerivativeClient.getModelViews(urn);
        const view = views.data.metadata[0]; // Taking the first view, since we don't support multiple views yet
        const guid = view.guid;
        let tree = await modelDerivativeClient.getObjectTree(urn, guid);
        while (tree.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            tree = await modelDerivativeClient.getObjectTree(urn, guid);
        }
        return {
            structuredContent: tree.data,
            content: [{
                type: "text",
                text: `Here's the hierarchy of ${tip.data.attributes.displayName}`
            }]
        };
    }
};
