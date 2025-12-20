import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { BrowserManager } from "./browser-manager";

const browserManager = new BrowserManager();

const server = new Server(
    { name: "playwright-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
);

/* ---------------- Tools ---------------- */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        { name: "launch_browser", description: "Launch browser", inputSchema: { type: "object" } },
        { name: "navigate_action", description: "Navigation actions", inputSchema: { type: "object" } },
        { name: "mouse_action", description: "Mouse actions", inputSchema: { type: "object" } },
        { name: "form_action", description: "Form actions", inputSchema: { type: "object" } },
        { name: "element_action", description: "Element actions", inputSchema: { type: "object" } },
        { name: "smart_click", description: "Self-healing click", inputSchema: { type: "object" } },
        { name: "get_page_state", description: "Page summary", inputSchema: { type: "object" } },
        { name: "get_accessibility_snapshot", description: "A11y tree", inputSchema: { type: "object" } },
        { name: "evaluate_readonly", description: "Safe JS eval", inputSchema: { type: "object" } },
        { name: "get_console_logs", description: "Console logs", inputSchema: { type: "object" } },
        { name: "get_network_failures", description: "Network failures", inputSchema: { type: "object" } },
        { name: "close_browser", description: "Close browser", inputSchema: { type: "object" } },
        { name: "wait_for_load_state", description: "Wait for page load", inputSchema: { type: "object" } },
        { name: "solve_captcha", description: "Attempt to solve CAPTCHA", inputSchema: { type: "object" } }
    ]
}));

/* ---------------- Execution ---------------- */

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const a = req.params.arguments as any;

    switch (req.params.name) {
        case "launch_browser":
            const headless = a?.headless ?? false; // Default to false (visible)
            console.error(`[launch_browser] Launching with headless: ${headless}`);
            await browserManager.launch(headless, a?.browserType);
            return { content: [{ type: "text", text: `launched (visible: ${!headless})` }] };

        case "solve_captcha":
            return { content: [{ type: "text", text: await browserManager.solveCaptcha() }] };

        case "wait_for_load_state":
            await browserManager.waitForLoadState(a.state);
            return { content: [{ type: "text", text: "waited" }] };

        case "navigate_action":
            console.error(`[navigate_action] ${JSON.stringify(a)}`);
            if (a.action === "open" || a.action === "navigate" || a.action === "goto" || (!a.action && a.url)) {
                await browserManager.navigate(a.url);
            } else if (a.action === "reload") {
                await browserManager.reload();
            } else if (a.action === "back") {
                await browserManager.back();
            } else if (a.action === "forward") {
                await browserManager.forward();
            } else if (a.action === "new_tab") {
                await browserManager.newTab(a.url);
            } else if (a.action === "switch_tab") {
                await browserManager.switchTab(a.tabIndex);
            } else if (a.action === "close_tab") {
                await browserManager.closeTab();
            } else {
                console.error(`[navigate_action] Unknown action: ${a.action}`);
                return { isError: true, content: [{ type: "text", text: `Unknown action: ${a.action}` }] };
            }
            return { content: [{ type: "text", text: "ok" }] };

        case "mouse_action":
            await browserManager.mouseAction(a.type, a.selector, a.targetSelector, a.amount);
            return { content: [{ type: "text", text: "ok" }] };

        case "form_action":
            await browserManager.formAction(a.type, a.selector, a.value, a.filePath);
            return { content: [{ type: "text", text: "ok" }] };

        case "element_action":
            const res = await browserManager.elementAction(a.type, a.selector, a.attribute, a.state);
            return { content: [{ type: "text", text: JSON.stringify(res) }] };

        case "smart_click":
            return { content: [{ type: "text", text: await browserManager.smartClick(a.selector) }] };

        case "get_page_state":
            return { content: [{ type: "text", text: JSON.stringify(await browserManager.getPageState()) }] };

        case "get_accessibility_snapshot":
            return { content: [{ type: "text", text: JSON.stringify(await browserManager.getAccessibilitySnapshot()) }] };

        case "evaluate_readonly":
            return { content: [{ type: "text", text: String(await browserManager.evaluateReadonly(a.expression)) }] };

        case "get_console_logs":
            return { content: [{ type: "text", text: JSON.stringify(await browserManager.getConsoleLogs()) }] };

        case "get_network_failures":
            return { content: [{ type: "text", text: JSON.stringify(await browserManager.getNetworkFailures()) }] };

        case "close_browser":
            await browserManager.close();
            return { content: [{ type: "text", text: "closed" }] };
    }

    throw new Error("Unknown tool");
});

/* ---------------- Start ---------------- */

server.connect(new StdioServerTransport());