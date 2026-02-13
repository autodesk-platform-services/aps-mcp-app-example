import z from "zod";
import { dataManagementClient, modelDerivativeClient } from "./common.js";

export const getDesignPropertiesToolFactory = ({ derivativeFormat }) => ({
    name: "get-design-properties",
    config: {
        title: "Get design properties",
        description: "Retrieves element properties of specified design.",
        inputSchema: {
            projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
            region: z.string().optional().describe("The region of the project the design belongs to. If not provided, the US region will be used."),
            designId: z.string().nonempty().describe("The ID of the design to get properties for."),
            objectId: z.number().optional().describe("The ID of the design element to get properties for. If not provided, properties of all elements will be returned."),
        },
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({ projectId, designId, region = "US", objectId = undefined }) => {
        const tip = await dataManagementClient.getItemTip(projectId, designId);
        const urn = tip.data.relationships.derivatives.data.id;
        const views = await modelDerivativeClient.getModelViews(urn);
        const view = views.data.metadata[0]; // Taking the first view, since we don't support multiple views yet
        const guid = view.guid;
        const args = { xAdsDerivativeFormat: derivativeFormat, region };
        if (objectId) {
            args.objectId = objectId;
        }
        let props = await modelDerivativeClient.getAllProperties(urn, guid, args);
        while (props.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            props = await modelDerivativeClient.getAllProperties(urn, guid, args);
        }
        return {
            structuredContent: props.data,
            content: [{
                type: "text",
                text: `Here's the properties of ${tip.data.attributes.displayName}, containing ${props.data.collection.length} elements`
            }]
        };
    }
});
