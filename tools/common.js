import { DataManagementClient } from "@aps_sdk/data-management";
import { ModelDerivativeClient } from "@aps_sdk/model-derivative";
import { getServiceAccountAccessToken } from "../auth.js";

class ServiceAccountAuthenticationProvider {
    constructor(scopes) {
        this._accessToken = null;
        this._expiresAt = 0;
        this._scopes = scopes;
    }

    async getAccessToken() {
        if (!this._accessToken || this._expiresAt < Date.now()) {
            const credentials = await getServiceAccountAccessToken(this._scopes);
            this._accessToken = credentials.access_token;
            this._expiresAt = Date.now() + credentials.expires_in * 1000;
        }
        return this._accessToken;
    }
}

const serviceAccountAuthenticationProvider = new ServiceAccountAuthenticationProvider(["data:read"]);
export const dataManagementClient = new DataManagementClient({ authenticationProvider: serviceAccountAuthenticationProvider });
export const modelDerivativeClient = new ModelDerivativeClient({ authenticationProvider: serviceAccountAuthenticationProvider });
