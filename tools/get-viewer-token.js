import { getServiceAccountAccessToken } from "../auth.js";

// App-only tool: hidden from the model, callable only by the viewer UI (via `app.callServerTool`).
// Lets the viewer refresh tokens when they expire. The preview-design tool also returns a token,
// but only as a fallback for hosts that don't support calling server tools from the app.
export const getViewerTokenToolFactory = () => ({
    name: "get-viewer-token",
    config: {
        title: "Get viewer token",
        description: "Generates a short-lived access token for loading designs in the viewer.",
        annotations: { readOnlyHint: true },
        _meta: {
            ui: {
                visibility: ["app"],
            },
        },
    },
    callback: async () => {
        const credentials = await getServiceAccountAccessToken(["viewables:read"]);
        return {
            structuredContent: {
                accessToken: credentials.access_token,
                expiresIn: credentials.expires_in,
            },
            content: [{
                type: "text",
                text: "Generated a viewer access token.",
            }]
        };
    }
});
