import z from "zod";
import { dataManagementClient, modelDerivativeClient } from "./common.js";

export const getDesignPropertiesTool = {
    name: "get-design-properties",
    config: {
        title: "Get design properties",
        description: "Retrieves all element properties of the specified design.",
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
        let props = await modelDerivativeClient.getAllProperties(urn, guid);
        while (props.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            props = await modelDerivativeClient.getAllProperties(urn, guid);
        }
        console.log("Design properties:", props.data);
        return {
            structuredContent: props.data,
            content: [{
                type: "text",
                text: `Here's the properties of ${tip.data.attributes.displayName}, containing ${props.data.collection.length} elements`
            }]
        };
    }
};
