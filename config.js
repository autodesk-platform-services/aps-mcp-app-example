import path from "node:path";
import url from "node:url";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
const { APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_PATH, PUBLIC_ENDPOINT_URL } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !SSA_ID || !SSA_KEY_ID || !SSA_KEY_PATH) {
    console.error("Missing one or more required environment variables: APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_PATH");
    process.exit(1);
}

const RESOURCE_URI = "ui://preview-design/viewer.html";
const VIEWER_HTML_PATH = path.resolve(__dirname, "dist", "viewer.html");
const PORT = parseInt(process.env.PORT || "3000");

export {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    SSA_ID,
    SSA_KEY_ID,
    SSA_KEY_PATH,
    PUBLIC_ENDPOINT_URL,
    RESOURCE_URI,
    VIEWER_HTML_PATH,
    PORT
}
