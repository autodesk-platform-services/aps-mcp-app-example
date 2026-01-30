import path from "node:path";
import url from "node:url";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
const { APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_BASE64 } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !SSA_ID || !SSA_KEY_ID || !SSA_KEY_BASE64) {
    console.error("Missing one or more required environment variables: APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_BASE64");
    process.exit(1);
}
const APS_REGION = process.env.APS_REGION || "US";
const RESOURCE_URI = "ui://preview-design/viewer.html";
const VIEWER_HTML_PATH = path.resolve(__dirname, "dist", "viewer.html");
const DERIVATIVE_FORMAT = process.env.DERIVATIVE_FORMAT || "fallback"; // "fallback" (SVF1) or "latest" (SVF2)
const PORT = parseInt(process.env.PORT || "3000");
const ALLOWED_HOSTS = ["localhost"];
if (process.env.PUBLIC_ENDPOINT_URL) {
    ALLOWED_HOSTS.push(process.env.PUBLIC_ENDPOINT_URL);
}

export {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_REGION,
    SSA_ID,
    SSA_KEY_ID,
    SSA_KEY_BASE64,
    ALLOWED_HOSTS,
    RESOURCE_URI,
    VIEWER_HTML_PATH,
    DERIVATIVE_FORMAT,
    PORT
}
