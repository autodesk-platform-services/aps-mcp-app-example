import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL) {
    console.error("Missing one or more required environment variables: APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL");
    process.exit(1);
}

const VIEWER_HTML = fs.readFileSync(path.resolve(__dirname, "dist", "viewer.html"), { encoding: "utf-8" });
const PORT = parseInt(process.env.PORT || "3000");
const ALLOWED_HOSTS = ["localhost"];
const PUBLIC_ENDPOINT_URL = process.env.PUBLIC_ENDPOINT_URL;
if (PUBLIC_ENDPOINT_URL) {
    ALLOWED_HOSTS.push(process.env.PUBLIC_ENDPOINT_URL);
}

export {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    ALLOWED_HOSTS,
    VIEWER_HTML,
    PUBLIC_ENDPOINT_URL,
    PORT
}
