# APS MCP App Example

Example MCP server for Autodesk Platform Services.

https://github.com/user-attachments/assets/13b2bf54-9ff6-4ca5-a56c-227b4aed83ca

## Features

- Authentication using APS 3-legged OAuth
- Browsing user's projects, designs, and design metadata (logical hierarchy and element properties)
- Embedding APS Viewer into the chat using [MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/index.html)
- Support for UK+4 regions (automatically detected from ACC hubs)
- IDs of elements selected in the viewer reported back to the LLM for further discussions (e.g., _Tell me more about this element_)

## What’s inside

- `server.js`: Express app with an MCP server using Streamable HTTP transport
- `auth.js`: Utils for authenticating with APS
- `config.js`: Collecting configuration inputs from environment variables
- `tools/`: MCP tools for ACC projects/designs
- `resources/`: MCP resource for the viewer
- `ui/`: Viewer UI built into `dist/viewer.html` by Vite

## Run locally

1. Install dependencies:
   `npm install`
2. Create a `.env` in the repo root:
   - `APS_CLIENT_ID`
   - `APS_CLIENT_SECRET`
   - `APS_CALLBACK_URL`
   - Optional: `PORT` (default `3000`)
   - Optional: `PUBLIC_ENDPOINT_URL` (added to CSP allowlist)
3. Build the UI bundle:
   `npm run build`
4. Start the server:
   `npm start`

Server will listen at `http://localhost:3000/mcp`.
