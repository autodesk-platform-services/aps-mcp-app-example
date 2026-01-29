import { App } from "@modelcontextprotocol/ext-apps";

const viewerConfig = {
    accessToken: "{{ACCESS_TOKEN}}",
    env: "AutodeskProduction2",
    api: "streamingV2", // or streamingV2_EU if in EMEA region 
};
Autodesk.Viewing.Initializer(viewerConfig, function () {
    const viewer = new Autodesk.Viewing.Viewer3D(document.getElementById("viewer"));
    viewer.start();
    const app = new App({ name: "Design Preview", version: "0.0.1" });
    app.ontoolresult = (result) => {
        console.log("Tool result received:", result);
        const urn = result.structuredContent?.urn;
        if (urn) {
            loadModel(viewer, urn);
        }
    };
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
    app.connect();
});

function loadModel(viewer, urn) {
    console.log("Loading model", urn);
    Autodesk.Viewing.Document.load(
        "urn:" + urn,
        (doc) => viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry()),
        (errorCode, errorMessage, errors) => console.error("Failed to load document:", errorCode, errorMessage, errors)
    );
}
