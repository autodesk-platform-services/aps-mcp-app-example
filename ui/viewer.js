import { App, applyDocumentTheme, applyHostStyleVariables, applyHostFonts } from "@modelcontextprotocol/ext-apps";
import * as z from "zod";

const LOGGER = "design-viewer";
const SELECTION_DEBOUNCE_MS = 300;
const MAX_SELECTION_DETAILS = 25; // Limit how many elements we describe to the model
const SELECTION_PROPS = ["name", "Category", "Type Name", "Family Name", "Material", "Level", "externalId"];

const app = new App({ name: "Design Viewer", version: "0.0.1" });

let viewer = null; // Autodesk.Viewing.GuiViewer3D instance
let viewerReadyPromise = null; // Resolves with the viewer once initialized
let modelReadyPromise = null; // Resolves with the currently loaded model
let currentDesign = null; // { urn, name }
let currentDisplayMode = "inline";

// #region Logging and errors

function log(level, message, details) {
    (level === "error" ? console.error : console.debug)(`[${LOGGER}]`, message, details ?? "");
    if (app.getHostCapabilities()?.logging) {
        app.sendLog({ level, logger: LOGGER, data: details ? { message, details: String(details) } : message }).catch(() => { });
    }
}

// Protocol-level errors (e.g., failed requests, handler exceptions)
app.onerror = (err) => log("error", "App error", err?.stack || err);
// Anything else that slips through in the iframe
window.addEventListener("error", (ev) => log("error", "Unhandled error", ev.error?.stack || ev.message));
window.addEventListener("unhandledrejection", (ev) => log("error", "Unhandled promise rejection", ev.reason?.stack || ev.reason));

// #endregion

// #region Host context: theme, styles, display modes

const displayModeButtons = {
    fullscreen: document.getElementById("toggle-fullscreen"),
    pip: document.getElementById("toggle-pip"),
};

function handleHostContextChanged(ctx) {
    if (ctx.theme) {
        applyDocumentTheme(ctx.theme);
    }
    if (ctx.styles?.variables) {
        applyHostStyleVariables(ctx.styles.variables);
    }
    if (ctx.styles?.css?.fonts) {
        applyHostFonts(ctx.styles.css.fonts);
    }
    if (ctx.theme || ctx.styles?.variables) {
        syncViewerTheme();
    }
    if (ctx.availableDisplayModes !== undefined) {
        for (const [mode, button] of Object.entries(displayModeButtons)) {
            button.hidden = !ctx.availableDisplayModes.includes(mode);
        }
    }
    if (ctx.displayMode) {
        setDisplayModeState(ctx.displayMode);
    }
}

// Converts any CSS color (e.g., "#fff", "rgb(...)", "light-dark(...)") into [r, g, b]
function parseCssColor(value) {
    if (!value) {
        return null;
    }
    const probe = document.createElement("div");
    probe.style.color = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const match = resolved.match(/\d+(\.\d+)?/g);
    return match && match.length >= 3 ? match.slice(0, 3).map(Number) : null;
}

function syncViewerTheme() {
    if (!viewer) {
        return;
    }
    const theme = document.documentElement.dataset.theme || app.getHostContext()?.theme || "light";
    viewer.setTheme(theme === "dark" ? "dark-theme" : "light-theme");
    const background = parseCssColor(getComputedStyle(document.documentElement).getPropertyValue("--color-background-primary").trim());
    if (background) {
        viewer.setBackgroundColor(...background, ...background);
    }
}

function setDisplayModeState(mode) {
    currentDisplayMode = mode;
    document.body.dataset.displayMode = mode;
    for (const [buttonMode, button] of Object.entries(displayModeButtons)) {
        button.classList.toggle("active", buttonMode === mode);
        button.title = buttonMode === mode ? "Return to inline view" : (buttonMode === "fullscreen" ? "Full screen" : "Picture-in-picture");
    }
    viewer?.resize();
}

async function toggleDisplayMode(mode) {
    const requestedMode = currentDisplayMode === mode ? "inline" : mode;
    try {
        const result = await app.requestDisplayMode({ mode: requestedMode });
        setDisplayModeState(result.mode);
    } catch (err) {
        log("error", `Failed to switch to ${requestedMode} display mode`, err);
    }
}

for (const [mode, button] of Object.entries(displayModeButtons)) {
    button.addEventListener("click", () => toggleDisplayMode(mode));
}
document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && currentDisplayMode === "fullscreen") {
        toggleDisplayMode("fullscreen");
    }
});

app.addEventListener("hostcontextchanged", handleHostContextChanged);

// #endregion

// #region Viewer

let fallbackToken = null; // { accessToken, expiresAt } from the preview-design tool result

function setFallbackToken(token) {
    fallbackToken = token?.accessToken
        ? { accessToken: token.accessToken, expiresAt: Date.now() + token.expiresIn * 1000 }
        : null;
}

async function fetchTokenFromServer() {
    const result = await app.callServerTool({ name: "get-viewer-token", arguments: {} });
    if (result.isError || !result.structuredContent?.accessToken) {
        throw new Error(result.content?.[0]?.text || "Missing access token in the tool result.");
    }
    return result.structuredContent;
}

// Called by the viewer whenever it needs a token, including when the current one is about to expire.
// Prefers the app-only get-viewer-token tool (fresh tokens, never passing through the model),
// and falls back to the token from the preview-design tool result (no refresh) for hosts
// that don't support calling server tools from the app.
async function getAccessToken(callback) {
    if (app.getHostCapabilities()?.serverTools) {
        try {
            const { accessToken, expiresIn } = await fetchTokenFromServer();
            callback(accessToken, expiresIn);
            return;
        } catch (err) {
            log("warning", "Failed to get viewer access token from server, using fallback token", err);
        }
    }
    const remaining = fallbackToken ? Math.floor((fallbackToken.expiresAt - Date.now()) / 1000) : 0;
    if (remaining > 0) {
        callback(fallbackToken.accessToken, remaining);
    } else {
        log("error", "No valid viewer access token available. Ask for the design preview again to get a new token.");
    }
}

function initViewer(config) {
    if (!viewerReadyPromise) {
        viewerReadyPromise = new Promise((resolve) => {
            Autodesk.Viewing.Initializer({ ...config, getAccessToken }, function () {
                viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById("viewer"));
                viewer.start();
                viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, onSelectionChanged);
                registerContextMenu();
                syncViewerTheme();
                resolve(viewer);
            });
        });
    }
    return viewerReadyPromise;
}

async function loadModel(urn, name, config) {
    currentDesign = { urn, name };
    modelReadyPromise = initViewer(config).then((viewer) => new Promise((resolve, reject) => {
        Autodesk.Viewing.Document.load(
            "urn:" + urn,
            async (doc) => {
                try {
                    if (viewer.model) {
                        viewer.unloadModel(viewer.model);
                    }
                    resolve(await viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()));
                } catch (err) {
                    reject(err);
                }
            },
            (errorCode, errorMessage) => reject(new Error(`Failed to load document (code ${errorCode}): ${errorMessage}`))
        );
    }));
    try {
        await modelReadyPromise;
    } catch (err) {
        log("error", "Failed to load design", err);
        // Let the model know, so it can explain the problem or retry
        app.updateModelContext({
            content: [{ type: "text", text: `The viewer failed to load design "${name}": ${err.message}` }],
            structuredContent: { urn, error: err.message },
        }).catch(() => { });
    }
}

function getBulkProperties(model, dbIds, propFilter) {
    return new Promise((resolve, reject) => model.getBulkProperties(dbIds, { propFilter }, resolve, reject));
}

async function describeElements(dbIds) {
    const results = await getBulkProperties(viewer.model, dbIds.slice(0, MAX_SELECTION_DETAILS), SELECTION_PROPS);
    return results.map((result) => {
        const props = Object.fromEntries(result.properties.map((prop) => [prop.displayName, prop.displayValue]));
        return { dbId: result.dbId, name: result.name, externalId: result.externalId, properties: props };
    });
}

function formatElements(elements, totalCount) {
    const lines = elements.map((el) => {
        const details = Object.entries(el.properties).map(([key, value]) => `${key}: ${value}`).join(", ");
        return `- ${el.name} (dbId ${el.dbId}${details ? `; ${details}` : ""})`;
    });
    if (totalCount > elements.length) {
        lines.push(`- ...and ${totalCount - elements.length} more`);
    }
    return lines.join("\n");
}

let selectionTimer = null;
function onSelectionChanged() {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(reportSelection, SELECTION_DEBOUNCE_MS);
}

async function reportSelection() {
    if (!app.getHostCapabilities()?.updateModelContext) {
        return;
    }
    const dbIds = viewer.getSelection();
    const design = currentDesign?.name ? ` in design "${currentDesign.name}"` : "";
    try {
        if (dbIds.length === 0) {
            await app.updateModelContext({
                content: [{ type: "text", text: `The user has no elements selected${design}.` }],
                structuredContent: { urn: currentDesign?.urn, selection: [] },
            });
            return;
        }
        const elements = await describeElements(dbIds);
        await app.updateModelContext({
            content: [{
                type: "text",
                text: `The user selected ${dbIds.length} element(s)${design}:\n${formatElements(elements, dbIds.length)}`,
            }],
            structuredContent: { urn: currentDesign?.urn, selection: dbIds, elements },
        });
    } catch (err) {
        log("error", "Failed to report selection", err);
    }
}

function registerContextMenu() {
    viewer.registerContextMenuCallback("AskAI", (menu, status) => {
        if (status.hasSelected && app.getHostCapabilities()?.message) {
            menu.push({ title: "Ask AI about this element", target: askAboutSelection });
        }
    });
}

async function askAboutSelection() {
    const dbIds = viewer.getSelection();
    if (dbIds.length === 0) {
        return;
    }
    try {
        const elements = await describeElements(dbIds);
        const design = currentDesign?.name ? ` from the design "${currentDesign.name}"` : "";
        await app.sendMessage({
            role: "user",
            content: [{
                type: "text",
                text: `Tell me more about the following element(s)${design}:\n${formatElements(elements, dbIds.length)}`,
            }],
        });
    } catch (err) {
        log("error", "Failed to send message", err);
    }
}

// #endregion

// #region App-side tools (callable by the model while the viewer is open)

const dbIdsSchema = z.array(z.number().int()).describe("IDs of design elements (dbIds), e.g., from the get-design-hierarchy or get-design-properties tools, or from the user's selection.");

async function getModel() {
    if (!modelReadyPromise) {
        throw new Error("No design is loaded in the viewer.");
    }
    return modelReadyPromise;
}

function textResult(text, structuredContent) {
    return { content: [{ type: "text", text }], structuredContent };
}

app.registerTool(
    "select",
    {
        title: "Select elements",
        description: "Selects the specified elements in the viewer and zooms to them. Pass an empty array to clear the selection.",
        inputSchema: z.object({ dbIds: dbIdsSchema }),
    },
    async ({ dbIds }) => {
        const model = await getModel();
        if (dbIds.length === 0) {
            viewer.clearSelection();
            return textResult("Selection cleared.", { selected: [] });
        }
        viewer.select(dbIds, model);
        viewer.fitToView(dbIds, model);
        return textResult(`Selected ${dbIds.length} element(s).`, { selected: dbIds });
    }
);

app.registerTool(
    "isolate",
    {
        title: "Isolate elements",
        description: "Isolates the specified elements in the viewer, hiding everything else, and zooms to them. Pass an empty array to show all elements again.",
        inputSchema: z.object({ dbIds: dbIdsSchema }),
    },
    async ({ dbIds }) => {
        const model = await getModel();
        viewer.isolate(dbIds, model);
        if (dbIds.length === 0) {
            viewer.fitToView(null, model);
            return textResult("All elements are visible again.", { isolated: [] });
        }
        viewer.fitToView(dbIds, model);
        return textResult(`Isolated ${dbIds.length} element(s).`, { isolated: dbIds });
    }
);

app.registerTool(
    "color",
    {
        title: "Color elements",
        description: "Highlights the specified elements in the viewer with a color. Pass an empty array of IDs to remove all colors.",
        inputSchema: z.object({
            dbIds: dbIdsSchema,
            color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ff0000").describe("Color in the #RRGGBB format."),
        }),
    },
    async ({ dbIds, color }) => {
        const model = await getModel();
        if (dbIds.length === 0) {
            viewer.clearThemingColors(model);
            return textResult("Removed all colors.", { colored: [] });
        }
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
        const vec = new THREE.Vector4(r, g, b, 1);
        for (const dbId of dbIds) {
            viewer.setThemingColor(dbId, vec, model, true);
        }
        return textResult(`Colored ${dbIds.length} element(s) with ${color}.`, { colored: dbIds, color });
    }
);

// #endregion

// #region Lifecycle

app.addEventListener("toolresult", (result) => {
    const { urn, name, config, fallbackToken } = result.structuredContent || {};
    if (urn && config) {
        setFallbackToken(fallbackToken);
        loadModel(urn, name, config);
    }
});

app.onteardown = async () => {
    clearTimeout(selectionTimer);
    if (viewer) {
        if (viewer.model) {
            viewer.unloadModel(viewer.model);
        }
        viewer.finish();
        viewer = null;
        Autodesk.Viewing.shutdown();
    }
    return {};
};

app.connect().then(() => {
    const ctx = app.getHostContext();
    if (ctx) {
        handleHostContextChanged(ctx);
    }
});

// #endregion
