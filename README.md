# APS MCP App Example

Example MCP server for Autodesk Platform Services with support for [MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/index.html). It exposes tools for browsing projects and designs in Autodesk Construction Cloud, and a UI resource providing interactive preview of selected designs using APS Viewer.

https://github.com/user-attachments/assets/eafff7ff-5282-4a87-af8b-912273545842

## Features

- Authentication using [Secure Service Account API](https://aps.autodesk.com/en/docs/ssa/v1/developers_guide/overview/)
- Support for UK+4 regions (automatically detected from ACC hubs)
- Support for switching between SVF(1) and SVF2
   - SVF2 used by default
   - In order to load SVF(1), add `format=svf` query parameter to the MCP server URL, e.g., https://aps-mcp-app-example.onrender.com/mcp?format=svf
- IDs of elements selected in the viewer reported back to the LLM for further discussions (e.g., _Tell me more about this element_)

## Live demo

A live demo of this MCP server is running on https://aps-mcp-app-example.onrender.com. Here's how to try it out:

> [!TIP]
> If you're using Visual Studio Code, you can easily install the MCP server usign these links:
>
> - [Install to Visual Studio Code](vscode:mcp/install?%7B%22name%22%3A%22APS%20MCP%20Server%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Faps-mcp-app-example.onrender.com%2Fmcp%22%7D)
> - [Install to Visual Studio Code Insiders](vscode-insiders:mcp/install?%7B%22name%22%3A%22APS%20MCP%20Server%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Faps-mcp-app-example.onrender.com%2Fmcp%22%7D)

- Get an MCP client that supports MCP apps, for example, [Visual Studio Code Insiders](https://code.visualstudio.com/insiders)
- Register the MCP server URL: https://aps-mcp-app-example.onrender.com/mcp
- Start asking questions such as
   - _What projects do I have access to?_
   - _Are there any Revit designs?_
   - _Show me the Snowdon Architecture design_

If you'd like to test the MCP server with your own data, you can do so by following the steps below. **Be careful though!** This implementation uses a single Secure Service Account for everyone, meaning that whatever data you give it access to will be visible to all the other users of this live demo:

- Provision access to your ACC hub for the following client ID:

   ```
   AhH9QfKLgiyRA0ADroS6E63QzUFtZk8iDpytJE7sa3Ln1DAC
   ```

- Invite the following Secure Service Account to a folder with some content:

   ```
   aws-quicksight-user@AhH9QfKLgiyRA0ADroS6E63QzUFtZk8iDpytJE7sa3Ln1DAC.adskserviceaccount.com
   ```

## What’s inside

- `server.js`: Express app with an MCP server using Streamable HTTP transport
- `auth.js`: Utils for authenticating the access to APS using Secure Service Accounts
- `config.js`: Collecting configuration inputs from environment variables
- `tools/`: MCP tools for APS projects/designs
- `resources/`: MCP resource for the viewer
- `ui/`: Viewer UI built into `dist/viewer.html` by Vite

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
