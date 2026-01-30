import fs from "node:fs";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { VIEWER_HTML_PATH, RESOURCE_URI } from "../config.js";

export const viewerResource = {
    name: "viewer",
    uri: RESOURCE_URI,
    config: {
        mimeType: RESOURCE_MIME_TYPE
    },
    callback: async () => {
        const html = fs.readFileSync(VIEWER_HTML_PATH, "utf-8");
        return {
            contents: [{
                uri: RESOURCE_URI,
                mimeType: RESOURCE_MIME_TYPE,
                text: html,
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
