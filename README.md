# Playwright MCP Server

This MCP server exposes comprehensive browser automation tools.

## Tools

### Navigation (`navigate_action`)
- **open**: `url`
- **reload**
- **back**
- **forward**
- **new_tab**: `url` (optional)
- **switch_tab**: `tabIndex`
- **close_tab**

### Mouse (`mouse_action`)
- **click**: `selector`
- **double_click**: `selector`
- **right_click**: `selector`
- **hover**: `selector`
- **drag_drop**: `selector` (source), `target`
- **scroll**: `amount` (optional)

### Forms (`form_action`)
- **fill**: `selector`, `value`
- **select**: `selector`, `value`
- **check**: `selector`
- **uncheck**: `selector`
- **radio**: `selector`
- **submit**: `selector`
- **upload**: `selector`, `filePath`
- **clear**: `selector`

### Elements (`element_action`)
- **focus**: `selector`
- **blur**: `selector`
- **read_text**: `selector`
- **read_value**: `selector`
- **read_attr**: `selector`, `attribute`
- **is_visible**: `selector`
- **is_enabled**: `selector`
- **wait**: `selector`, `state` ('visible', 'hidden', etc.)

### Signals & State
- **get_page_state**: URL, title, buttons, inputs.
- **get_accessibility_snapshot**: Semantic tree.
- **get_console_logs**: Browser logs.
- **get_network_failures**: Failed network requests.

### Maintenance
- **launch_browser**: `headless`, `browserType` ('chromium', 'firefox', 'webkit')
- **close_browser**
- **smart_click**: `selector` (Self-healing attempt)
