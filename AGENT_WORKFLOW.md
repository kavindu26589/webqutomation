# Playwright Agent Workflow

## 1. 🎭 Planner Agent
**Goal**: Explore and Plan.

-   **Tools**: `launch_browser`, `navigate_action`, `get_page_state`, `get_accessibility_snapshot`.
-   **Workflow**:
    1.  `launch_browser({ "headless": false })`
    2.  `navigate_action({ "action": "open", "url": "..." })`
    3.  `get_page_state()` -> quick summary of interactive elements.
    4.  `get_accessibility_snapshot()` -> detailed semantic tree.

## 2. 🎭 Generator Agent
**Goal**: Execute actions.

-   **Tools**: `mouse_action`, `form_action`, `element_action`.
-   **Workflow**:
    1.  **Interact**:
        -   Click: `mouse_action({ "type": "click", "selector": "..." })`
        -   Type: `form_action({ "type": "fill", "selector": "...", "value": "..." })`
    2.  **Verify**:
        -   Check state: `element_action({ "type": "read_text", "selector": "..." })`

## 3. 🎭 Healer Agent
**Goal**: Recover from errors (e.g., selector not found).

-   **Tools**: `smart_click`, `get_console_logs`, `get_network_failures`.
-   **Trigger**: Action fails.
-   **Workflow**:
    1.  **Diagnose**: Check `get_console_logs` or `get_network_failures`.
    2.  **Attempt Heal**: Use `smart_click({ "selector": "..." })` which tries multiple strategies (css, text, role).
    3.  **Re-Plan**: If that fails, call `get_accessibility_snapshot()` again to find a new selector.

## 📝 Workflow Input Layout

```markdown
# WORKFLOW: [Name]

## Goal
[Description]

## Steps
1.  Navigate to "..."
2.  Click "Submit"
```
