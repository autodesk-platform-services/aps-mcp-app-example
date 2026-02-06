import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Design Viewer", version: "0.0.1" });
app.ontoolresult = (result) => {
    console.debug("Tool result received:", result);
    const urn = result.structuredContent?.urn;
    const config = result.structuredContent?.config;
    if (urn && config) {
        loadModel(urn, config);
    }
};
app.connect();
app.requestDisplayMode({ mode: "pip" });

let viewerInitializedPromise = null;

function loadModel(urn, config) {
    if (!viewerInitializedPromise) {
        viewerInitializedPromise = new Promise((resolve, reject) => {
            Autodesk.Viewing.Initializer(config, function () {
                const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById("viewer"));
                viewer.start();
                viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, async () => {
                    const ids = viewer.getSelection();
                    if (ids.length > 0) {
                        await app.updateModelContext({
                            content: [{ type: "text", text: `User selected objects with IDs: ${ids.join(", ")}` }],
                        });
                    } else {
                        await app.updateModelContext({
                            content: [{ type: "text", text: "No objects selected" }],
                        });
                    }
                });
                resolve(viewer);
            });
        });
    }
    return viewerInitializedPromise.then(viewer => {
        Autodesk.Viewing.Document.load(
            "urn:" + urn,
            (doc) => viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()),
            (errorCode, errorMessage, errors) => console.error("Failed to load document:", errorCode, errorMessage, errors)
        );
    });
}
