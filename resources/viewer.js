import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { VIEWER_HTML } from "../config.js";

export const VIEWER_RESOURCE_URI = "ui://preview-design/viewer.html";

export const viewerResourceFactory = ({}) => ({
    name: "viewer",
    uri: VIEWER_RESOURCE_URI,
    config: {
        mimeType: RESOURCE_MIME_TYPE
    },
    callback: async () => {
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
                        }
                    },
                },
            }]
        };
    }
});
