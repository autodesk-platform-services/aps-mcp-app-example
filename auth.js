import { AuthenticationClient, ResponseType, Scopes } from "@aps_sdk/authentication";
import { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } from "./config.js";

const tokenMap = new Map();

export function generateAuthorizationUrl(sessionId) {
    if (!sessionId) {
        throw new Error("Session ID is required to generate authorization URL");
    }
    const authenticationClient = new AuthenticationClient();
    tokenMap.set(sessionId, null);
    return authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, [Scopes.DataRead], {
        state: sessionId,
    });
}

export function getAccessToken(sessionId) {
    if (!sessionId) {
        throw new Error("Session ID is required to get access token");
    }
    const credentials = tokenMap.get(sessionId);
    if (!credentials) {
        throw new Error("User is not authenticated");
    }
    return credentials.access_token;
}

export async function callbackHandler(req, res) {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Missing code or state");
    }
    if (!tokenMap.has(state)) {
        return res.status(400).send("Invalid state");
    }
    const authenticationClient = new AuthenticationClient();
    const credentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, code, APS_CALLBACK_URL, {
        clientSecret: APS_CLIENT_SECRET,
    });
    tokenMap.set(state, credentials);
    res.send("Authentication successful! You can close this window.");
}
