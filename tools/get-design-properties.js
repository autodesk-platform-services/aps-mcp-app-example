import z from "zod";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { DataManagementClient } from "@aps_sdk/data-management";
import { ModelDerivativeClient } from "@aps_sdk/model-derivative";
import { getAccessToken } from "../auth.js";

export const register = (server) => registerAppTool(server, "get-design-properties", {
    title: "Get Design Properties",
    description: "Retrieves element properties of specified design.",
    inputSchema: {
        projectId: z.string().nonempty().describe("The ID of the project the design belongs to."),
        region: z.string().optional().describe("The region of the project the design belongs to. If not provided, the US region will be used."),
        designId: z.string().nonempty().describe("The ID of the design to get properties for."),
        objectId: z.number().optional().describe("The ID of the design element to get properties for. If not provided, properties of all elements will be returned."),
    },
    annotations: { readOnlyHint: true },
    _meta: {},
}, async ({ projectId, designId, region = "US", objectId = undefined }, extra) => {
    const dataManagementClient = new DataManagementClient();
    const modelDerivativeClient = new ModelDerivativeClient();
    const accessToken = await getAccessToken(extra.sessionId);
    const tip = await dataManagementClient.getItemTip(projectId, designId, { accessToken });
    const urn = tip.data.relationships.derivatives.data.id;
    const views = await modelDerivativeClient.getModelViews(urn, { accessToken });
    const view = views.data.metadata[0]; // Taking the first view, since we don't support multiple views yet
    const guid = view.guid;
    const args = { region };
    if (objectId) {
        args.objectId = objectId;
    }
    let props = await modelDerivativeClient.getAllProperties(urn, guid, { ...args, accessToken });
    while (props.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        props = await modelDerivativeClient.getAllProperties(urn, guid, { ...args, accessToken });
    }
    return {
        structuredContent: props.data,
        content: [{
            type: "text",
            text: JSON.stringify(props.data, null, 2) // Some clients may not support rendering structured content, so we include a text representation as well
        }]
    };
});
