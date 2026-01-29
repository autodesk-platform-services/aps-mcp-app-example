import z from "zod";
import { dataManagementClient, modelDerivativeClient } from "./common.js";

export const getDesignHierarchyTool = {
    name: "get-design-hierarchy",
    config: {
        title: "Get design hierarchy",
        description: "Retrieves the hierarchical structure of elements within the specified design.",
        inputSchema: {
            projectId: z.string().nonempty(),
            designId: z.string().nonempty()
        },
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({ projectId, designId }) => {
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const urn = tip.data.relationships.derivatives.data.id;
        const views = await modelDerivativeClient.getModelViews(urn);
        const guid = views.data.metadata[0].guid;
        let tree = await modelDerivativeClient.getObjectTree(urn, guid);
        while (tree.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            tree = await modelDerivativeClient.getObjectTree(urn, guid);
        }
        console.log("Design hierarchy:", tree.data);
        return {
            structuredContent: tree.data,
            content: [{
                type: "text",
                text: `Here's the hierarchy of ${tip.data.attributes.displayName}`
            }]
        };
    }
};
