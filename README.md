# Product Agent UI

Thin React + Vite + TypeScript operator dashboard for local Product-Agent and commerce
backend APIs.

## Backend Contract

The Product-Agent UI expects these local endpoints from the Product-Agent API:

- `GET /api/health`
- `POST /api/jobs/prepare`
- `POST /api/jobs/render`
- `POST /api/jobs/publish`
- `GET /api/jobs`
- `GET /api/jobs/{job_id}`
- `POST /api/jobs/{job_id}/stop`
- `GET /api/jobs/{job_id}/logs`
- `GET /api/jobs/{job_id}/artifacts`

Job creation responses should include either `job_id` or `id`. The UI also accepts common wrapped shapes such as `{ "job": { ... } }`, `{ "data": { ... } }`, and `{ "result": { ... } }`.

Stop is available for queued/running-like jobs. `POST /api/jobs/{job_id}/stop` marks the
backend job as `cancelled`; `cancelled` is terminal, so the UI stops polling once that status
is returned. Backends may also report `killed` when they force-kill a subprocess; the UI treats
`killed` as terminal and failure-like.

The Catalog tab uses the commerce / price-fetcher API:

- `GET /commerce-api/health`
- `GET /commerce-api/catalog/products`
- `GET /commerce-api/catalog/category-hierarchy`
- `GET /commerce-api/catalog/brands`
- `GET /commerce-api/catalog/summary`
- `POST /commerce-api/price-monitoring/selection/preview`
- `POST /commerce-api/price-monitoring/runs`
- `GET /commerce-api/price-monitoring/runs`
- `GET /commerce-api/price-monitoring/runs/{run_id}`
- `POST /commerce-api/price-monitoring/runs/{run_id}/fetch`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/executions`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/logs`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/{execution_id}`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/{execution_id}/logs`
- `POST /commerce-api/price-monitoring/runs/{run_id}/fetch/cancel`
- `POST /commerce-api/price-monitoring/runs/{run_id}/fetch/{execution_id}/cancel`
- `GET /commerce-api/price-monitoring/runs/{run_id}/review`
- `POST /commerce-api/price-monitoring/runs/{run_id}/review/actions`
- `POST /commerce-api/price-monitoring/runs/{run_id}/export-price-update`
- `GET /commerce-api/price-monitoring/db/status`

The CSV/Bridge tab also uses the commerce / price-fetcher API:

- `GET /commerce-api/files/roots`
- `GET /commerce-api/files/list`
- `POST /commerce-api/files/read`
- `POST /commerce-api/files/save`
- `POST /commerce-api/files/save-copy`
- `POST /commerce-api/bridge/run`

Commerce artifacts are served through:

- `GET /commerce-api/artifacts/roots`
- `GET /commerce-api/artifacts/bridge/runs/{run_id}`
- `GET /commerce-api/artifacts/price-monitoring/runs/{run_id}`
- `GET /commerce-api/artifacts/read?path=...`
- `GET /commerce-api/artifacts/download?path=...`

The browser always uses the `/commerce-api` proxy for commerce calls. Vite rewrites those
requests to `/api` on the commerce backend, so `GET /commerce-api/health` reaches
`GET http://127.0.0.1:8001/api/health`.

## Windows 10 Setup

This repo works without WSL. From Command Prompt or PowerShell in this folder, run:

```powershell
.\setup-windows.cmd
.\dev-windows.cmd
```

`setup-windows.cmd` uses installed `node`/`npm` when they exist. If they are not on `PATH`, it downloads portable Node.js into `.tools` inside this repo and installs dependencies from there.

`dev-windows.cmd` starts Vite at `http://127.0.0.1:5173`.

To run a production build on Windows:

```powershell
.\build-windows.cmd
```

## Manual Setup

If Node.js and npm are already installed, these commands also work:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

## Local Startup Checklist

Recommended Windows startup:

1. Configure the Product-Agent API command if needed:

```cmd
set PRODUCT_AGENT_API_CMD=<your Product-Agent API start command>
```

2. Start all local platform windows:

```cmd
scripts\windows\start-all.cmd
```

3. Diagnose local services:

```cmd
scripts\windows\diagnose.cmd
```

Optional startup environment variables:

- `PRICE_FETCHER_DIR`: local `price-fetcher` repository path. Defaults to sibling `..\price-fetcher`.
- `PRODUCT_AGENT_DIR`: local Product-Agent repository path. Defaults to sibling `..\Product-Agent`.
- `PRODUCT_AGENT_API_CMD`: command that starts the Product-Agent API on `127.0.0.1:8000`.
- `VITE_API_PROXY_TARGET`: Product-Agent proxy target. Defaults to `http://127.0.0.1:8000`.
- `VITE_COMMERCE_API_PROXY_TARGET`: commerce proxy target. Defaults to `http://127.0.0.1:8001`.

Manual startup:

1. Start the Product-Agent API:

```powershell
start Product-Agent API on 127.0.0.1:8000
```

2. Start the commerce API from `price-fetcher`:

```powershell
python -m pip install -e .
pricefetcher-api
```

3. Start the UI:

```powershell
npm run dev
```

4. Open:

```text
http://127.0.0.1:5173
```

Required local files for the commerce workflows:

- `C:\Users\user\Downloads\sourceCata.csv`
- `C:\Exports\CheckWHouseBalance.csv` for bridge runs

You can also run a terminal diagnostic check on Windows:

```powershell
.\diagnose-windows.cmd
scripts\windows\diagnose.cmd
```

Local dev uses Vite proxies by default:

```bash
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_COMMERCE_API_BASE_URL=
VITE_COMMERCE_API_PROXY_TARGET=http://127.0.0.1:8001
```

- Product-Agent API default: `http://127.0.0.1:8000`
- Commerce API default: `http://127.0.0.1:8001`
- `/api` proxies to the Product-Agent API.
- `/commerce-api` proxies to the commerce API and rewrites requests to `/api`.

Set `VITE_API_BASE_URL` or `VITE_COMMERCE_API_BASE_URL` only when the browser should call
that backend directly instead of using the Vite proxy.

Leave browser base URLs empty when using the Vite dev proxy. Use direct base URLs only if CORS
is configured by the backend. The `/commerce-api` route works through the Vite dev proxy; it
will not work by opening static files directly in the browser.

## Scripts

```powershell
npm run dev
npm run build
npm run preview
```

## Notes

- This is a UI-only repo. Backend job logic stays in the backend.
- The Catalog tab can browse commerce catalog products and preview/create Price Monitoring
  selection runs.
- Catalog and Price Monitoring use backend-native hierarchy filters from
  `/commerce-api/catalog/category-hierarchy`: Family, Category, and Sub-Category. The UI
  label is `Category`, while request payloads and query params use the backend field
  `category_name`.
- Catalog and Price Monitoring submit hierarchy filters as `family`, `category_name`, and
  `sub_category`.
- Raw OpenCart category strings remain available as expandable row debug information in the
  Catalog table, but they are not the primary filtering mechanism.
- Raw category is debug-only in normal UI flows. Legacy Price Monitoring run summaries may
  still show `Raw category: ...` when old run data only contains `filters.category`.
- Catalog column visibility is stored in browser `localStorage` under
  `productAgentUi.catalog.columns.v1`. Reset columns restores the default layout.
- Manufacturer filters load from `/commerce-api/catalog/brands` and submit the exact manufacturer
  string selected in the dropdown.
- If the category hierarchy endpoint fails or is unavailable, update and start the latest
  `price-fetcher` backend.
- The CSV/Bridge tab gets safe file roots from the commerce backend, opens CSV files through
  backend file APIs, and keeps edited CSV values as strings so values such as `005606` are
  preserved.
- Save-copy is the safe default for CSV edits. Save-in-place requires typing the exact path
  being overwritten before the UI enables the action.
- Bridge runs are executed by the commerce backend. When the stock CSV path is omitted, the
  backend default stock file is used.
- Bridge and Price Monitoring run artifacts are listed through the artifact endpoints and
  can be previewed or downloaded through `/commerce-api/artifacts/download?path=...`.
- CSV artifacts preview as tables with string-preserved values. JSON artifacts preview as
  formatted text when valid and raw text otherwise. TXT and LOG artifacts preview as plain text.
- If artifact links fail, confirm the latest `price-fetcher` backend is installed and running.
- The Price Monitoring tab supports this workflow: preview/create a selection run, fetch
  competitor prices, load review rows, choose `match_price`, `undercut`, or `ignore` actions,
  apply those review actions, and export an OpenCart price update CSV.
- Price Monitoring fetch is asynchronous from the UI perspective. The UI starts a fetch with
  `POST /commerce-api/price-monitoring/runs/{run_id}/fetch`, polls
  `GET /commerce-api/price-monitoring/runs/{run_id}/fetch`, reads logs from
  `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/logs`, and cancels active fetches with
  `POST /commerce-api/price-monitoring/runs/{run_id}/fetch/cancel`.
- Price Monitoring fetch execution statuses are `queued`, `running`, `succeeded`, `failed`, and
  `killed`, and `cancelled`. `killed` is terminal and failure-like; it means the backend
  force-killed the subprocess. Product-Agent jobs can also return `killed`, and those jobs appear
  under Failed filters. `cancelled` remains terminal and separate from Failed.
- Price Monitoring has section navigation for Workflow, Executions, and Alerts. The Executions
  page shows fetch execution history for the current selected run only, with a compact Current run
  header. Killed execution detail can refetch through the normal fetch endpoint using that
  execution's previous source and catalog URL, creating a new execution.
- Failed and killed Price Monitoring artifacts are shown as diagnostic artifacts by default.
  `artifacts_are_diagnostic` is authoritative for every status, so successful executions can also
  show artifacts as diagnostic when the backend marks them that way. Execution detail can preview
  logs without rendering full logs inline by default.
- Key pages preserve compact form, filter, and workflow state across route navigation and browser
  refresh in the same session using `sessionStorage`. Per-page subtle reset actions clear saved
  state. Large server-backed results such as catalog rows, observation tables, review tables, CSV
  contents, and API responses are reloaded instead of permanently stored.
- The Price Monitoring and Price Alerts pages show database status banners. When the database is
  unavailable, DB-backed write actions are disabled, but read-only tables and file-backed
  selection/fetch/review/export workflows remain visible and usable where the backend supports
  them.
- BestPrice fetches can include an optional `catalog_url` hint, while the backend may also
  resolve products from MPN data.
- Price Monitoring export is CSV only. The UI does not update OpenCart automatically.
- No authentication, websocket transport, batch upload, Redux, Zustand, or React Query is included.
- Job detail and jobs list polling runs every 2.5 seconds while queued/running-like statuses are present, then stops once the backend reports a terminal status.
- The Jobs page sorts by most recently updated first and supports All, Active, Succeeded,
  Failed, and Cancelled filters.
