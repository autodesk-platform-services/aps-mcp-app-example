import { registerAppResource } from "@modelcontextprotocol/ext-apps/server";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { VIEWER_HTML, PUBLIC_ENDPOINT_URL } from "../config.js";

export const VIEWER_RESOURCE_URI = "ui://preview-design/viewer.html";

export const register = (server) => registerAppResource(server, "viewer", VIEWER_RESOURCE_URI, {
    mimeType: RESOURCE_MIME_TYPE,
}, async () => {
    return {
        contents: [{
            uri: VIEWER_RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: VIEWER_HTML,
            _meta: {
                ui: {
                    csp: {
                        resourceDomains: [ // Origins for static assets (images, fonts, styles, scripts)
                            "https://developer.api.autodesk.com",
                            "https://cdn.derivative.autodesk.com",
                            "https://fonts.autodesk.com",
                            "blob:",
                            "data:",
                        ],
                        connectDomains: [ // Origins for fetch/XHR/WebSocket requests
                            "https://developer.api.autodesk.com",
                            "https://cdn.derivative.autodesk.com",
                            "https://fonts.autodesk.com",
                            "wss://cdn.derivative.autodesk.com",
                        ],
                        frameDomains: [], // Origins for nested iframes
                    },
                    domain: PUBLIC_ENDPOINT_URL ? `https://${PUBLIC_ENDPOINT_URL}` : null,
                },
            },
        }]
    };
});
