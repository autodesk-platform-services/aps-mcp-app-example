import z from "zod";
import { dataManagementClient, modelDerivativeClient } from "./common.js";
import { APS_REGION, DERIVATIVE_FORMAT } from "../config.js";

export const getDesignHierarchyTool = {
    name: "get-design-hierarchy",
    config: {
        title: "Get design hierarchy",
        description: "Retrieves the logical structure of elements within specified design.",
        inputSchema: {
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            designId: z.string().nonempty().describe("The ID of the design to get hierarchy for."),
            objectId: z.number().optional().describe("The ID of the design element to get hierarchy for. If not provided, hierarchy of all elements will be returned."),
        },
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({ projectId, designId, objectId = undefined }) => {
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const urn = tip.data.relationships.derivatives.data.id;
        const views = await modelDerivativeClient.getModelViews(urn);
        const view = views.data.metadata[0]; // Taking the first view, since we don't support multiple views yet
        const guid = view.guid;
        const args = { xAdsDerivativeFormat: DERIVATIVE_FORMAT, region: APS_REGION };
        if (objectId) {
            args.objectId = objectId;
        }
        let tree = await modelDerivativeClient.getObjectTree(urn, guid, args);
        while (tree.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            tree = await modelDerivativeClient.getObjectTree(urn, guid, args);
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
