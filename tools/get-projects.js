import { dataManagementClient } from "./common.js";

export const getProjectsToolFactory = ({}) => ({
    name: "get-projects",
    config: {
        title: "Get projects",
        description: "Retrieves all Autodesk Construction Cloud (ACC) accounts and projects accessible to the application.",
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({}) => {
        const hubs = await dataManagementClient.getHubs();
        const projects = await Promise.all((hubs.data || []).map(hub => dataManagementClient.getHubProjects(hub.id)));
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
                text: `Found ${output.accounts.length} accounts with a total of ${output.accounts.reduce((sum, acc) => sum + acc.projects.length, 0)} projects.`
            }]
        };
    }
});
