# Developer Notes

## Login: URL Mode Elicitation or Tool?

The MCP spec includes [URL mode elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#url-mode-elicitation-requests) which says:

> [!IMPORTANT]
> URL mode elicitation is not for authorizing the MCP client’s access to the MCP server (that’s handled by MCP authorization). Instead, it’s used when the MCP server needs to obtain sensitive information or third-party authorization on behalf of the user. The MCP client’s bearer token remains unchanged. The client’s only responsibility is to provide the user with context about the elicitation URL the server wants them to open.

This sounds like a good fit for our case as we don't worry about the auth between MCP client and MCP server (customers could use their own IdP, or no auth at all). The TypeScript SDK includes an example of how this feature could be used for 3rd party auth, see [elicitationUrlExample.ts](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/examples/server/elicitationUrlExample.ts#L71-L113).

Unfortunately, the URL mode elicitation doesn't seem to be widely supported yet. When trying it with VSCode GitHub Copilot, I get the following error:

`Client does not support url elicitation.`

So for now we may need to get the authorization URL to users in a different way, e.g., by throwing an exception from tools when the user is not authenticated.

## Login: When?

I see a couple of options in terms of _when_ to ask the user to login:

### Option 1: Elicit on Session Init

```js
if (sessionId && transports.has(sessionId)) {
    // ...
} else if (!sessionId && isInitializeRequest(req.body)) {
    const server = createMcpServer();
    transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv4(),
        onsessioninitialized: sessionId => {
            transports.set(sessionId, transport);
            server.server.elicitInput({
                mode: "url",
                url: generateAuthorizationUrl(sessionId),
                message: "Please authenticate with Autodesk Construction Cloud (ACC) to continue.",
            });
        },
    });
} else {
    // ...
}
```

As mentioned earlier, URL elicitation may not be supported by certain MCP clients. Also, I'm not sure if this isn't "too soon" to start the user to login.

### Option 2: Elicit on Tool Use

In this case, tools would attempt to get an access token for the current session, eliciting the user to login if credentials are not available:

```js
export function getAccessToken(sessionId, server) {
    if (!sessionId) {
        throw new Error("Session ID is required to get access token");
    }
    const credentials = tokenMap.get(sessionId);
    if (!credentials) {
        server.server.elicitInput({
            mode: "url",
            url: generateAuthorizationUrl(sessionId),
            message: "Please authenticate with Autodesk Construction Cloud (ACC) to continue.",
        });
        // Somehow wait until we receive the callback, and exchange the temporary code for an access token
    }
    return credentials.access_token;
}
```

As mentioned earlier, URL elicitation may not be supported by certain MCP clients. Also, the code would need to wait until the MCP server receives the callback URL which would make the implementation a bit trickier.

### Option 3: Throw Exceptions from Tools

In this case, tools would attempt to get an access token for the current session, throwing an exception if credentials are not available:

```js
export function getAccessToken(sessionId) {
    if (!sessionId) {
        throw new Error("Session ID is required");
    }
    const credentials = _credentialsCache.get(sessionId);
    if (!credentials) {
        throw new Error(`User not authenticated. Please [login](${generateAuthorizationUrl(sessionId)}) with your Autodesk account to continue.`);
    }
    return credentials.access_token;
}
```

This seems to be the most robust approach given the circumstances.
