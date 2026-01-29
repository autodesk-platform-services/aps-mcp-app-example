import { App } from "@modelcontextprotocol/ext-apps";

const ACCESS_TOKEN = "{{ACCESS_TOKEN}}";

const app = new App({ name: "Design Preview", version: "0.0.1" });

Autodesk.Viewing.Initializer({ accessToken: ACCESS_TOKEN }, function () {
    const viewer = new Autodesk.Viewing.Viewer3D(document.getElementById("viewer"));
    viewer.start();
    app.ontoolresult = (result) => {
        console.log("Tool result received:", result);
        const urn = result.structuredContent?.urn;
        if (urn) {
            loadModel(viewer, urn);
        }
    };
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
