import z from "zod";
import { dataManagementClient } from "./common.js";

export const getProjectContentsTool = {
    name: "get-project-contents",
    config: {
        title: "Get project contents",
        description: "Retrieves top-level folders in a project or contents of a specified folder in Autodesk Construction Cloud (ACC).",
        inputSchema: {
            accountId: z.string().nonempty().describe("The ID of the account the project belongs to."),
            projectId: z.string().nonempty().describe("The ID of the project to get contents for."),
            folderId: z.string().optional().describe("The ID of the folder to get contents for. If not provided, top-level folders will be returned.")
        },
        annotations: { readOnlyHint: true },
        _meta: {},
    },
    callback: async ({ accountId, projectId, folderId }) => {
        const { data } = folderId
            ? await dataManagementClient.getFolderContents(projectId, folderId)
            : await dataManagementClient.getProjectTopFolders(accountId, projectId);
        const output = {
            contents: (data || []).map((item) => ({
                id: item.id,
                type: item.type,
                name: item.attributes.displayName
            }))
        };
        return {
            structuredContent: output,
            content: [{
                type: "text",
                text: `Found ${output.contents.length} entries in ${folderId || projectId}`
            }]
        };
    }
};
