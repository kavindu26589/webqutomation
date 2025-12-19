import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ErrorCode,
    McpuError
} from "@modelcontextprotocol/sdk/types.js";
import { BrowserManager } from "./browser-manager.js";

const browserManager = new BrowserManager();

const server = new Server(
    {
        name: "playwright-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// Define Tools with optimized descriptions
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "launch_browser",
                description: "Launch browser.",
                inputSchema: {
                    type: "object",
                    properties: {
                        headless: { type: "boolean", default: true }
                    }
                },
            },
            {
                name: "navigate",
                description: "Navigate to URL.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string" }
                    },
                    required: ["url"]
                },
            },
            {
                name: "click",
                description: "Click element.",
                inputSchema: {
                    type: "object",
                    properties: {
                        selector: { type: "string" }
                    },
                    required: ["selector"]
                },
            },
            {
                name: "type",
                description: "Type text.",
                inputSchema: {
                    type: "object",
                    properties: {
                        selector: { type: "string" },
                        text: { type: "string" }
                    },
                    required: ["selector", "text"]
                },
            },
            {
                name: "get_accessibility_snapshot",
                description: "Get accessibility tree (RECOMMENDED for page state).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_console_logs",
                description: "Get console logs.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_content",
                description: "Get full HTML (Expensive).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "screenshot",
                description: "Take screenshot.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "Save path" }
                    },
                },
            },
            {
                name: "evaluate",
                description: "Run JS.",
                inputSchema: {
                    type: "object",
                    properties: {
                        script: { type: "string" }
                    },
                    required: ["script"]
                },
            },
            {
                name: "close_browser",
                description: "Close browser.",
                inputSchema: { type: "object", properties: {} },
            },
        ],
    };
});

// Handle Tool Calls with concise return values
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        switch (request.params.name) {
            case "launch_browser": {
                const headless = (request.params.arguments as any)?.headless ?? true;
                await browserManager.launch(headless);
                return { content: [{ type: "text", text: "Launched" }] };
            }
            case "navigate": {
                const url = (request.params.arguments as any).url;
                await browserManager.navigate(url);
                return { content: [{ type: "text", text: `Navigated: ${url}` }] };
            }
            case "click": {
                const selector = (request.params.arguments as any).selector;
                await browserManager.click(selector);
                return { content: [{ type: "text", text: "Clicked" }] };
            }
            case "type": {
                const { selector, text } = (request.params.arguments as any);
                await browserManager.type(selector, text);
                return { content: [{ type: "text", text: "Typed" }] };
            }
            case "get_accessibility_snapshot": {
                const snapshot = await browserManager.getAccessibilitySnapshot();
                return { content: [{ type: "text", text: JSON.stringify(snapshot) }] };
            }
            case "get_console_logs": {
                const logs = await browserManager.getConsoleLogs();
                return { content: [{ type: "text", text: JSON.stringify(logs) }] };
            }
            case "get_content": {
                const content = await browserManager.getContent();
                return { content: [{ type: "text", text: content }] }; // This is still large, use carefully
            }
            case "screenshot": {
                const path = (request.params.arguments as any)?.path;
                const result = await browserManager.screenshot(path);
                return { content: [{ type: "text", text: result }] };
            }
            case "evaluate": {
                const script = (request.params.arguments as any).script;
                const result = await browserManager.evaluate(script);
                return { content: [{ type: "text", text: String(result) }] };
            }
            case "close_browser": {
                await browserManager.close();
                return { content: [{ type: "text", text: "Closed" }] };
            }
            default:
                throw new McpuError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { isError: true, content: [{ type: "text", text: `Error: ${errorMessage}` }] };
    }
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "playwright://page/content",
                name: "Page Content",
                mimeType: "text/html",
            },
        ],
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "playwright://page/content") {
        try {
            const content = await browserManager.getContent();
            return {
                contents: [{ uri: request.params.uri, mimeType: "text/html", text: content }]
            };
        } catch (e) {
            throw new McpuError(ErrorCode.InternalError, "Not ready");
        }
    }
    throw new McpuError(ErrorCode.InvalidRequest, "Not found");
});

// Start
const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
    console.error(err);
    process.exit(1);
});
