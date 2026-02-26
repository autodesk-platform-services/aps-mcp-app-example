import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { DataManagementClient } from "@aps_sdk/data-management";
import { getAccessToken } from "../auth.js";

export const register = (server) => registerAppTool(server, "get-projects", {
    title: "Get Projects",
    description: "Retrieves all Autodesk Construction Cloud (ACC) accounts and projects accessible to the application.",
    annotations: { readOnlyHint: true },
    _meta: {},
}, async (extra) => {
    const dataManagementClient = new DataManagementClient();
    const accessToken = await getAccessToken(extra.sessionId);
    const hubs = await dataManagementClient.getHubs({ accessToken });
    const projects = await Promise.all((hubs.data || []).map(hub => dataManagementClient.getHubProjects(hub.id, { accessToken })));
    const output = {
        accounts: (hubs.data || []).map((hub, i) => ({
            id: hub.id,
            name: hub.attributes.name,
            projects: (projects[i].data || []).map(project => ({
                id: project.id,
                name: project.attributes.name,
                region: hub.attributes.region || "US",
            }))
        }))
    };
    return {
        structuredContent: output,
        content: [{
            type: "text",
            text: JSON.stringify(output, null, 2) // Some clients may not support rendering structured content, so we include a text representation as well
        }]
    };
});
