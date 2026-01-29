import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import { APS_CLIENT_ID, APS_CLIENT_SECRET, SSA_ID, SSA_KEY_ID, SSA_KEY_PATH } from "./config.js";

export async function getServiceAccountAccessToken(scopes) {
    const privateKey = await fs.readFile(SSA_KEY_PATH, "utf-8");
    const assertion = createAssertion(APS_CLIENT_ID, SSA_ID, SSA_KEY_ID, privateKey, scopes);
    return getAccessToken(APS_CLIENT_ID, APS_CLIENT_SECRET, "urn:ietf:params:oauth:grant-type:jwt-bearer", scopes, assertion);
}

function createAssertion(clientId, serviceAccountId, serviceAccountKeyId, serviceAccountPrivateKey, scopes) {
    const payload = {
        iss: clientId,
        sub: serviceAccountId,
        aud: "https://developer.api.autodesk.com/authentication/v2/token",
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        scope: scopes
    };
    return jwt.sign(payload, serviceAccountPrivateKey, {
        algorithm: "RS256",
        header: {
            alg: "RS256",
            kid: serviceAccountKeyId
        },
        noTimestamp: true
    });
}

async function getAccessToken(clientId, clientSecret, grantType, scopes, assertion) {
    const headers = {
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const body = new URLSearchParams({
        "grant_type": grantType,
        "scope": scopes.join(" "),
        "assertion": assertion
    });
    const response = await fetch("https://developer.api.autodesk.com/authentication/v2/token", { method: "POST", headers, body });
    if (!response.ok) {
        throw new Error(`Could not generate access token: ${await response.text()}`);
    }
    return response.json();
}
