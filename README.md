# APS MCP App Example

Example MCP server for Autodesk Platform Services with support for [MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/index.html). It exposes tools for browsing projects and designs in Autodesk Construction Cloud, and a UI resource providing interactive preview of selected designs using APS Viewer.

## What’s inside

- `server.js`: Express app with an MCP server using Streamable HTTP transport
- `auth.js`: Utils for authenticating the access to APS using Secure Service Accounts
- `config.js`: Collecting configuration inputs from environment variables
- `tools/`: MCP tools for APS projects/designs
- `resources/`: MCP UI resource for the viewer
- `viewer.html`/`viewer.js`/`viewer.css`: UI built into `dist/viewer.html` by Vite

## Run locally

1. Install dependencies:
   `npm install`
2. Create a `.env` in the repo root:
   - `APS_CLIENT_ID`
   - `APS_CLIENT_SECRET`
   - `SSA_ID`
   - `SSA_KEY_ID`
   - `SSA_KEY_BASE64` (base64-encoded PEM private key)
   - Optional: `PORT` (default `3000`)
   - Optional: `PUBLIC_ENDPOINT_URL` (added to CSP allowlist)
3. Build the UI bundle:
   `npm run build`
4. Start the server:
   `npm start`

Server will listen at `http://localhost:3000/mcp`.
