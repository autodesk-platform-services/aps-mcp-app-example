# APS MCP App Example

Example MCP server for Autodesk Platform Services with support for [MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/index.html). It exposes tools for browsing projects and designs in Autodesk Construction Cloud, and a UI resource providing interactive preview of selected designs using APS Viewer.

https://github.com/user-attachments/assets/eafff7ff-5282-4a87-af8b-912273545842

## What’s inside

- `server.js`: Express app with an MCP server using Streamable HTTP transport
- `auth.js`: Utils for authenticating the access to APS using Secure Service Accounts
- `config.js`: Collecting configuration inputs from environment variables
- `tools/`: MCP tools for APS projects/designs
- `resources/`: MCP UI resource for the viewer
- `viewer.html`/`viewer.js`/`viewer.css`: UI built into `dist/viewer.html` by Vite

## Live demo

A live demo of this MCP server is running on https://aps-mcp-app-example.onrender.com. Here's how to try it out:

- Provision access to your ACC hub for the following client ID: `AhH9QfKLgiyRA0ADroS6E63QzUFtZk8iDpytJE7sa3Ln1DAC`
- Invite the following Secure Service Account to a folder with some content: `aws-quicksight-user@AhH9QfKLgiyRA0ADroS6E63QzUFtZk8iDpytJE7sa3Ln1DAC.adskserviceaccount.com`
- Add the MCP server https://aps-mcp-app-example.onrender.com/mcp to an MCP client that supports MCP apps, for example, [Visual Studio Code Insiders](https://code.visualstudio.com/insiders)

> Note: by default the viewer will load content using the `fallback` (SVF1) format. In order to switch to `latest` (SVF2), add `format=svf2` query to the MCP server address: https://aps-mcp-app-example.onrender.com/mcp?format=svf2.

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
