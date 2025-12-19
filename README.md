# Playwright MCP Server

This is a Model Context Protocol (MCP) server that exposes Playwright capabilities, allowing AI agents to control a web browser.

## Project Structure

- `src/index.ts`: Main server entry point.
- `src/browser-manager.ts`: Wrapper around Playwright to manage browser state.
- `package.json`: Dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Install Playwright Browsers**
    ```bash
    npx playwright install chromium
    ```

## Running the Server

### Development Mode
To run the server directly from source:
```bash
npm run dev
```

### Production Build
To build and run the compiled JavaScript:
```bash
npm run build
npm start
```

## Testing with MCP Inspector

You can use the MCP Inspector to test the tools interactively:

```bash
npx @modelcontextprotocol/inspector node src/index.ts
```

## Available Tools

- `launch_browser(headless?, browser?, channel?)`: Launch a browser.
    - `browser`: 'chromium' (default), 'firefox', or 'webkit'.
    - `channel`: 'chrome', 'msedge' (only for chromium).
- `navigate(url)`: Go to a URL.
- `click(selector)`: Click an element.
- `type(selector, text)`: Type text into an input.
- `get_content()`: Get the current page HTML.
- `screenshot(path?)`: Take a screenshot.
- `evaluate(script)`: Run JS on the page.
- `close_browser`: Close the browser.

## Capabilities

- **Resources**: `playwright://page/content` allows reading the current page content as a resource.
