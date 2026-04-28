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
- `GET /api/jobs/{job_id}/logs`
- `GET /api/jobs/{job_id}/artifacts`

Job creation responses should include either `job_id` or `id`. The UI also accepts common wrapped shapes such as `{ "job": { ... } }`, `{ "data": { ... } }`, and `{ "result": { ... } }`.

The Catalog tab uses the commerce / price-fetcher API:

- `GET /api/catalog/products`
- `GET /api/catalog/categories`
- `GET /api/catalog/brands`
- `GET /api/catalog/summary`
- `POST /api/price-monitoring/selection/preview`
- `POST /api/price-monitoring/runs`
- `GET /api/price-monitoring/runs`
- `GET /api/price-monitoring/runs/{run_id}`
- `POST /api/price-monitoring/runs/{run_id}/fetch`
- `GET /api/price-monitoring/runs/{run_id}/fetch`
- `GET /api/price-monitoring/runs/{run_id}/review`
- `POST /api/price-monitoring/runs/{run_id}/review/actions`
- `POST /api/price-monitoring/runs/{run_id}/export-price-update`

The CSV/Bridge tab also uses the commerce / price-fetcher API:

- `GET /api/files/roots`
- `GET /api/files/list`
- `POST /api/files/read`
- `POST /api/files/save`
- `POST /api/files/save-copy`
- `POST /api/bridge/run`

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
- The CSV/Bridge tab gets safe file roots from the commerce backend, opens CSV files through
  backend file APIs, and keeps edited CSV values as strings so values such as `005606` are
  preserved.
- Save-copy is the safe default for CSV edits. Save-in-place requires typing the exact path
  being overwritten before the UI enables the action.
- Bridge runs are executed by the commerce backend. When the stock CSV path is omitted, the
  backend default stock file is used.
- The Price Monitoring tab supports this workflow: preview/create a selection run, fetch
  competitor prices, load review rows, choose `match_price`, `undercut`, or `ignore` actions,
  apply those review actions, and export an OpenCart price update CSV.
- BestPrice fetches can include an optional `catalog_url` hint, while the backend may also
  resolve products from MPN data.
- Price Monitoring export is CSV only. The UI does not update OpenCart automatically.
- No authentication, websocket transport, batch upload, artifact previewing, Redux, Zustand, or React Query is included.
- Job detail and jobs list polling runs every 2.5 seconds while queued/running-like statuses are present, then stops once the backend reports a terminal status.
