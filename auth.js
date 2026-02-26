import { AuthenticationClient, ResponseType, Scopes } from "@aps_sdk/authentication";
import { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } from "./config.js";

const _credentials = new Map();

export async function getAccessToken(sessionId) {
    if (!sessionId) {
        throw new Error("Session ID is required to get access token");
    }
    let credentials = _credentials.get(sessionId);
    if (!credentials) {
        throw new Error(`User not authenticated. Please [login](${generateAuthorizationUrl(sessionId)}) with your Autodesk account to continue.`);
    }
    if (Date.now() > credentials.expires_at) {
        try {
            const authenticationClient = new AuthenticationClient();
            const newCredentials = await authenticationClient.refreshToken(credentials.refresh_token, APS_CLIENT_ID, {
                clientSecret: APS_CLIENT_SECRET,
            });
            credentials.access_token = newCredentials.access_token;
            credentials.refresh_token = newCredentials.refresh_token;
            credentials.expires_at = newCredentials.expires_at;
        } catch (err) {
            _credentials.delete(sessionId);
            throw new Error(`Failed to refresh access token. Please [login](${generateAuthorizationUrl(sessionId)}) again.`);
        }
    }
    return credentials.access_token;
}

export function generateAuthorizationUrl(sessionId) {
    if (!sessionId) {
        throw new Error("Session ID is required to generate authorization URL");
    }
    const authenticationClient = new AuthenticationClient();
    _credentials.set(sessionId, null);
    return authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, [Scopes.DataRead], {
        state: sessionId,
    });
}

export async function callbackHandler(req, res) {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Missing code or state");
    }
    if (!_credentials.has(state)) {
        return res.status(400).send("Invalid state");
    }
    const authenticationClient = new AuthenticationClient();
    const credentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, code, APS_CALLBACK_URL, {
        clientSecret: APS_CLIENT_SECRET,
    });
    _credentials.set(state, credentials);
    res.send("Authentication successful! You can close this window.");
}
