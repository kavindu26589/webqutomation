import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private consoleLogs: string[] = [];

    async launch(headless: boolean = true) {
        if (this.browser) return;
        this.browser = await chromium.launch({ headless });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();

        // Context Optimization: Capture logs to avoid needing to inspect UI manually
        this.page.on('console', msg => {
            // Keep log format concise
            const log = `[${msg.type()}] ${msg.text()}`;
            this.consoleLogs.push(log);
            // Optional: Cap log size to prevent context explosion if long-running
            if (this.consoleLogs.length > 1000) this.consoleLogs.shift();
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            this.consoleLogs = [];
        }
    }

    ensureInitialized() {
        if (!this.browser || !this.page) {
            throw new Error('Browser not initialized.');
        }
        return this.page;
    }

    async navigate(url: string) {
        const page = this.ensureInitialized();
        await page.goto(url);
    }

    async click(selector: string) {
        const page = this.ensureInitialized();
        await page.click(selector);
    }

    async type(selector: string, text: string) {
        const page = this.ensureInitialized();
        await page.fill(selector, text);
    }

    // Optimized: Return accessibility tree for LLM consumption (much smaller than HTML)
    async getAccessibilitySnapshot() {
        const page = this.ensureInitialized();
        return await page.accessibility.snapshot();
    }

    async getContent() {
        const page = this.ensureInitialized();
        return await page.content();
    }

    async getConsoleLogs() {
        return this.consoleLogs;
    }

    async screenshot(path?: string) {
        const page = this.ensureInitialized();
        if (path) {
            await page.screenshot({ path });
            return `Saved: ${path}`;
        } else {
            const buffer = await page.screenshot();
            return buffer.toString('base64');
        }
    }

    async evaluate(script: string) {
        const page = this.ensureInitialized();
        return await page.evaluate(script);
    }
}
