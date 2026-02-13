# APS MCP App Example

Example MCP server for Autodesk Platform Services with support for [MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/index.html). It exposes tools for browsing projects and designs in Autodesk Construction Cloud, and a UI resource providing interactive preview of selected designs using APS Viewer.

https://github.com/user-attachments/assets/13b2bf54-9ff6-4ca5-a56c-227b4aed83ca

## Features

- Authentication using [Secure Service Account API](https://aps.autodesk.com/en/docs/ssa/v1/developers_guide/overview/)
- Support for UK+4 regions (automatically detected from ACC hubs)
- Support for switching between SVF(1) and SVF2 viewing formats
  - SVF2 used by default
  - In order to load SVF(1), add `format=svf` query parameter to the MCP server URL, e.g., http://localhost:3000/mcp?format=svf
- IDs of elements selected in the viewer reported back to the LLM for further discussions (e.g., _Tell me more about this element_)

## What’s inside

- `server.js`: Express app with an MCP server using Streamable HTTP transport
- `auth.js`: Utils for authenticating the access to APS using Secure Service Accounts
- `config.js`: Collecting configuration inputs from environment variables
- `tools/`: MCP tools for APS projects/designs
- `resources/`: MCP resource for the viewer
- `ui/`: Viewer UI built into `dist/viewer.html` by Vite

## Run locally

> You'll need a Secure Service Account and a private key. See our [Introducing Secure Service Accounts](https://aps.autodesk.com/blog/introducing-secure-service-accounts-ssa-now-public-beta) blog post for more details.

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
