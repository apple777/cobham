# idDAS Mock Dev Server

Vanilla Node.js dev server that serves the **unmodified** legacy GUI from `../src/` and mocks the Lua CGI backend (`/cgi/cmd.lua`).

> **The GUI covers full device lifecycle management:** provisioning, RF routing, device monitoring, alarms, configuration backup, software update, and system administration.

See also: [Full project analysis](../docs/GITHUB.md)

---

## Quick start

```bash
cd mock-client
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:8080/target/ | Legacy MSDH topology GUI (RequireJS + jQuery) |
| http://localhost:8080/topology-d3/ | Independent D3 topology page (ES modules) |
| http://localhost:8080/config/platform.settings.json | Platform settings JSON |
| http://localhost:8080/ | Redirects to `/topology-d3/` |
| POST http://localhost:8080/cgi/cmd.lua | Mock Axell Shell backend |

Port defaults to **8080**. Override with `PORT=9000 npm run dev`.

---

## Architecture

```
Browser
  ├── /target/*     → src/msdh/* or src/<module>/*  (legacy GUI)
  ├── /topology-d3/* → mock-client/topology-d3/*     (D3 page)
  ├── /config/*     → mock-client/config/*           (platform JSON)
  └── POST /cgi/cmd.lua
         ↓
      devServer.js
         ↓
      mockCommandRouter.js → fixtures/*.json + appState.js
```

### Server files

| File | Role |
|------|------|
| `server/devServer.js` | HTTP server, static files, CGI handler |
| `server/targetResolver.js` | `/target/*`, `/topology-d3/*`, `/config/*` path resolution |
| `server/mockCommandRouter.js` | Command dispatch |
| `server/defaultHandlers.js` | Handlers + catch-all for unknown commands |
| `server/appState.js` | Loads fixtures, builds topology/routing bundles |

---

## Fixture files

| File | Mock responses for |
|------|-------------------|
| `fixtures/attributes.json` | `get tag`, `get mdl`, `get swv`, etc. |
| `fixtures/operators.json` | `operators --json`, USEROPERATOR |
| `fixtures/topology.json` | SECTGRP, topology, rack bundles |
| `fixtures/routing.json` | RFROUTE profiles, route detail, cells |
| `fixtures/alarms.json` | Alarms dump |
| `fixtures/thresholds.json` | Alarm config layout |
| `fixtures/system.json` | Measurements, backups, banks |

Unknown commands are logged to the terminal:

```
[mock-cgi] unhandled command: SOME COMMAND --json
```

Add handlers in `defaultHandlers.js` or `mockCommandRouter.js`.

---

## Platform settings (D3 page)

**File:** `config/platform.settings.json`

Used exclusively by `/topology-d3/`. Not yet wired into mock CGI fixtures.

Sections: `platformMeta`, `designTokens`, `sessionContext`, `headerBar`, `systemOverviewBar`, `navigationMenu`, `severityModel`, `topologyD3`, `mockApiBindings`.

Edit JSON → reload `/topology-d3/` to see changes.

---

## Independent D3 topology

```
topology-d3/
├── index.html
├── css/topology-d3.css
└── js/
    ├── topologyApp.js              # Bootstrap
    ├── platformConfigLoader.js     # Settings loader
    ├── navigationMenuRenderer.js   # Legacy menu from JSON
    └── topologyD3Renderer.js       # D3 v3 renderer
```

Features: 4-layer topology matching MSDH screenshot, header + toolbar, full navigation menu with `/target/*` links, D3 zoom, severity LEDs.

Not yet implemented: jsPlumb connections, node popup, polling, Rack View.

---

## Adding a mock command

1. Add response to the appropriate `fixtures/*.json`
2. Register handler in `server/mockCommandRouter.js`:

```javascript
router.registerExact('MY COMMAND --json', () => JSON.stringify({ ok: true }));
```

3. Restart server and verify in browser Network tab or terminal logs

### Important command order

MSDH uses this order for routing profiles:

```
RFROUTE PROFILES -o oper1 --json
```

Not `RFROUTE -o oper1 PROFILES --json`.

---

## Naming conventions

| Context | Convention | Example |
|---------|------------|---------|
| Legacy DOM `id` | snake_case | `#topology-container` |
| Mock server files | camelCase | `mockCommandRouter.js` |
| Fixture JSON keys | match axsh output | `"Node Type"`, `SysName` |
| Platform settings keys | camelCase | `layerId`, `routingProfileValue` |
| Mock commands | exact axsh string | `operators --json` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8080 in use | Kill existing Node process or set `PORT` |
| Operator dropdown shows `undefined` | Handled in `appState.js` — falls back to `oper1` |
| Topology icons 404 | Check `src/images/icons/` — `sectgrp_icon.png` may be missing |
| Menu not showing on D3 page | Hover header for 500ms; check browser console for module errors |
| Legacy page blank | Check terminal for unhandled CGI commands; add handlers |

---

## Related documentation

- [Full project analysis](../docs/GITHUB.md)
- [Root README](../README.md)
- Cursor rules: `.cursor/rules/iddas-legacy-mock.mdc`, `.cursor/rules/iddas-platform-topology-d3.mdc`
