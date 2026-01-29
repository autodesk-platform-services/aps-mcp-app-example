import fs from "node:fs";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { getServiceAccountAccessToken } from "../auth.js";
import { VIEWER_HTML_PATH, PUBLIC_ENDPOINT_URL, RESOURCE_URI } from "../config.js";

const DOMAINS = [
    "https://developer.api.autodesk.com",
    "https://cdn.derivative.autodesk.com",
    "https://fonts.autodesk.com",
    "wss://cdn.derivative.autodesk.com", // Doesn't work??? OpenAI prefixes wss:// with https:// internally...
];
if (PUBLIC_ENDPOINT_URL) {
    DOMAINS.push(PUBLIC_ENDPOINT_URL);
}

export const viewerResource = {
    name: "viewer",
    uri: RESOURCE_URI,
    config: {
        mimeType: RESOURCE_MIME_TYPE
    },
    callback: async () => {
        const credentials = await getServiceAccountAccessToken(["viewables:read"]);
        const html = fs.readFileSync(VIEWER_HTML_PATH, "utf-8");
        return {
            contents: [{
                uri: RESOURCE_URI,
                mimeType: RESOURCE_MIME_TYPE,
                text: html.replace("{{ACCESS_TOKEN}}", credentials.access_token),
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
                        }
                    },
                },
            }]
        };
    }
};
