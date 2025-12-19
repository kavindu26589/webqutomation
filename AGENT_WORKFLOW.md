# Playwright Agent Workflow

This MCP server enables you to act as the three standard Playwright Agents: **Planner**, **Generator**, and **Healer**.

## 1. 🎭 Planner Agent
**Goal**: Explore the app and produce a test plan.

-   **Tools**: `launch_browser`, `navigate`, `get_accessibility_snapshot`, `highlight`.
-   **Workflow**:
    1.  Launch and Navigate to the target page.
    2.  Use `get_accessibility_snapshot` to understand the UI structure.
    3.  Create a plan in `specs/<scenario>.md` listing steps and expected results.
    4.  Visual Verification: Use `highlight` to confirm selectors for key elements in your plan *before* finalizing it.

## 2. 🎭 Generator Agent
**Goal**: Transform plan into executable actions or code.

-   **Tools**: `click`, `type`, `evaluate`, `screenshot`.
-   **Workflow**:
    1.  Read the plan from `specs/`.
    2.  **Live Verification**: Execute each step via MCP tools (`click`, `type`) to verify it works *real-time*.
    3.  **Codify**: If successful, write the corresponding Playwright code to `tests/<scenario>.spec.ts`.

## 3. 🎭 Healer Agent
**Goal**: Repair failing steps.

-   **Tools**: `get_console_logs`, `get_accessibility_snapshot`.
-   **Trigger**: An MCP tool execution returns an error (e.g., Timeout, Element Not Found).
-   **Workflow**:
    1.  **Diagnose**: Call `get_console_logs` to see if the app crashed or threw errors.
    2.  **Inspect**: Call `get_accessibility_snapshot` to see the *current* DOM state.
    3.  **Fix**:
        -   If selector failed: Find a new robust selector (prefer role/text) using the snapshot.
        -   If timing issue: Add wait logic (in code) or retry (in MCP).
    4.  **Verify**: Retry the action with the new parameter.

## 📝 Workflow Input Layout

When you want to trigger a workflow in the chat, use this layout:

```markdown
# WORKFLOW: [Name of Workflow]

## Goal
[Brief description of what to achieve]

## Steps
1.  [Action] (e.g., Navigate to "https://example.com")
2.  [Verification] (e.g., Verify "Login" button is visible)
3.  [Action] (e.g., Click "Login")
```

The Agent will parse this and execute it using the **Planner** strategy.
