import z from "zod";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { DataManagementClient } from "@aps_sdk/data-management";
import { getAccessToken } from "../auth.js";

export const register = (server) => registerAppTool(server, "get-project-contents", {
    title: "Get Project Contents",
    description: "Retrieves top-level folders in a project or contents of a specified folder in Autodesk Construction Cloud (ACC).",
    inputSchema: {
        accountId: z.string().nonempty().describe("The ID of the account the project belongs to."),
        projectId: z.string().nonempty().describe("The ID of the project to get contents for."),
        folderId: z.string().optional().describe("The ID of the folder to get contents for. If not provided, top-level folders will be returned.")
    },
    annotations: { readOnlyHint: true },
    _meta: {},
}, async ({ accountId, projectId, folderId }, extra) => {
    const dataManagementClient = new DataManagementClient();
    const accessToken = await getAccessToken(extra.sessionId);
    const { data } = folderId
        ? await dataManagementClient.getFolderContents(projectId, folderId, { accessToken })
        : await dataManagementClient.getProjectTopFolders(accountId, projectId, { accessToken });
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
            text: JSON.stringify(output, null, 2) // Some clients may not support rendering structured content, so we include a text representation as well
        }]
    };
});
