import {
    chromium,
    firefox,
    webkit,
    Browser,
    BrowserContext,
    Page
} from "playwright";

type BrowserType = "chromium" | "firefox" | "webkit";

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private pages: Page[] = [];

    private consoleLogs: string[] = [];
    private networkFailures: any[] = [];

    /* ---------------- Lifecycle ---------------- */

    async launch(headless = true, browserType: BrowserType = "chromium") {
        if (this.browser) return;

        const launcher =
            browserType === "firefox"
                ? firefox
                : browserType === "webkit"
                    ? webkit
                    : chromium;

        this.browser = await launcher.launch({ headless });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
        this.pages = [this.page];

        this.attachListeners(this.page);
    }

    async close() {
        await this.browser?.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        this.pages = [];
        this.consoleLogs = [];
        this.networkFailures = [];
    }

    private ensurePage(): Page {
        if (!this.page) throw new Error("Browser not initialized");
        return this.page;
    }

    /* ---------------- Listeners ---------------- */

    private attachListeners(page: Page) {
        page.on("console", msg => {
            this.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
            if (this.consoleLogs.length > 500) this.consoleLogs.shift();
        });

        page.on("requestfailed", req => {
            this.networkFailures.push({
                url: req.url(),
                method: req.method(),
                error: req.failure()?.errorText
            });
            if (this.networkFailures.length > 200) this.networkFailures.shift();
        });
    }

    /* ---------------- Navigation ---------------- */

    async navigate(url: string) {
        await this.ensurePage().goto(url, { waitUntil: "domcontentloaded" });
    }

    async reload() {
        await this.ensurePage().reload();
    }

    async back() {
        await this.ensurePage().goBack();
    }

    async forward() {
        await this.ensurePage().goForward();
    }

    async newTab(url?: string) {
        if (!this.context) throw new Error("Context not ready");
        const p = await this.context.newPage();
        this.attachListeners(p);
        this.pages.push(p);
        this.page = p;
        if (url) await p.goto(url);
    }

    async switchTab(index: number) {
        if (!this.pages[index]) throw new Error("Tab index not found");
        this.page = this.pages[index];
    }

    async closeTab() {
        const page = this.ensurePage();
        await page.close();
        this.pages = this.pages.filter(p => p !== page);
        this.page = this.pages[0] || null;
    }

    /* ---------------- Mouse Actions ---------------- */

    async mouseAction(type: string, selector?: string, target?: string, amount?: number) {
        const page = this.ensurePage();

        switch (type) {
            case "click":
                await page.locator(selector!).first().click();
                break;
            case "double_click":
                await page.locator(selector!).first().dblclick();
                break;
            case "right_click":
                await page.locator(selector!).first().click({ button: "right" });
                break;
            case "hover":
                await page.locator(selector!).first().hover();
                break;
            case "drag_drop":
                await page.dragAndDrop(selector!, target!);
                break;
            case "scroll":
                await page.mouse.wheel(0, amount ?? 500);
                break;
            default:
                throw new Error("Unknown mouse action");
        }
    }

    /* ---------------- Form Actions ---------------- */

    async formAction(type: string, selector: string, value?: any, filePath?: string) {
        const page = this.ensurePage();
        const el = page.locator(selector).first();

        switch (type) {
            case "fill":
                await el.fill(value);
                break;
            case "select":
                await el.selectOption(value);
                break;
            case "check":
                await el.check();
                break;
            case "uncheck":
                await el.uncheck();
                break;
            case "radio":
                await el.check();
                break;
            case "submit":
                await el.evaluate((e: any) => e.form?.submit());
                break;
            case "upload":
                await el.setInputFiles(filePath!);
                break;
            case "clear":
                await el.fill("");
                break;
            default:
                throw new Error("Unknown form action");
        }
    }

    /* ---------------- Element Actions ---------------- */

    async elementAction(type: string, selector: string, attr?: string, state?: string) {
        const page = this.ensurePage();
        const el = page.locator(selector).first();

        switch (type) {
            case "focus":
                await el.focus();
                return "focused";
            case "blur":
                await el.evaluate((e: any) => e.blur());
                return "blurred";
            case "read_text":
                return await el.textContent();
            case "read_value":
                return await el.inputValue();
            case "read_attr":
                return await el.getAttribute(attr!);
            case "is_visible":
                return await el.isVisible();
            case "is_enabled":
                return await el.isEnabled();
            case "wait":
                await el.waitFor({ state: state as any });
                return "waited";
            default:
                throw new Error("Unknown element action");
        }
    }

    /* ---------------- Self-Healing ---------------- */

    async smartClick(selector: string) {
        const page = this.ensurePage();
        const strategies = [
            () => page.locator(selector),
            () => page.getByRole("button", { name: selector }),
            () => page.getByText(selector)
        ];

        for (const s of strategies) {
            try {
                const loc = s().first();
                await loc.waitFor({ state: "visible", timeout: 3000 });
                await loc.click();
                return "clicked";
            } catch { }
        }
        throw new Error("smartClick failed");
    }

    /* ---------------- Page State ---------------- */

    async getPageState() {
        const page = this.ensurePage();
        return page.evaluate(() => ({
            url: location.href,
            title: document.title,
            buttons: [...document.querySelectorAll("button")].map(b => b.textContent?.trim()).filter(Boolean),
            inputs: [...document.querySelectorAll("input")].map(i => i.getAttribute("name") || i.placeholder),
            dialogs: document.querySelectorAll('[role="dialog"]').length
        }));
    }

    async getAccessibilitySnapshot() {
        return this.ensurePage().accessibility.snapshot({ interestingOnly: true });
    }

    /* ---------------- Read-only Eval ---------------- */

    async evaluateReadonly(expression: string) {
        return this.ensurePage().evaluate(`() => (${expression})`);
    }

    /* ---------------- Signals ---------------- */

    async getConsoleLogs() {
        return this.consoleLogs;
    }

    async getNetworkFailures() {
        return this.networkFailures;
    }
}