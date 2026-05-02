# UI Backend Contract Fixtures

The UI test suite uses mocked Product-Agent and commerce API responses so contract assumptions and critical page rendering can be checked without running either backend. These tests do not start subprocesses, open browsers, call live sites, read real CSV files, or require PostgreSQL/OpenCart/OpenAI.

Fixtures live in:

- `src/test/fixtures/productAgentApi.ts`
- `src/test/fixtures/commerceApi.ts`

The strict fetch helper in `src/test/mockFetch.ts` maps request method plus path to fixture responses and fails on any unexpected request. Fixture drift should be treated as a signal to intentionally update either the backend contract or the UI normalization layer.

## Product-Agent Endpoints

- `GET /api/health`
- `GET /api/jobs`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/logs`
- `GET /api/jobs/{job_id}/artifacts`
- `GET /api/settings`
- `GET /api/filters/status`
- `GET /api/filters/categories`
- `GET /api/filters/categories/{category_id}`
- `GET /api/filters/sync-report`
- `GET /api/filter-review/{model}`
- `GET /api/authoring/{model}`

## Commerce Endpoints

- `GET /commerce-api/health`
- `GET /commerce-api/catalog/summary`
- `GET /commerce-api/catalog/brands`
- `GET /commerce-api/catalog/category-hierarchy`
- `GET /commerce-api/catalog/products`
- `GET /commerce-api/price-monitoring/db/status`
- `GET /commerce-api/price-monitoring/runs`
- `GET /commerce-api/price-monitoring/runs/{run_id}`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/executions`
- `GET /commerce-api/price-monitoring/runs/{run_id}/fetch/logs`
- `GET /commerce-api/price-monitoring/runs/{run_id}/review`
- `GET /commerce-api/price-monitoring/alerts/rules`
- `GET /commerce-api/price-monitoring/alerts/events`
- `GET /commerce-api/artifacts/price-monitoring/runs/{run_id}`

## Updating Fixtures

When a backend contract intentionally changes, update the fixture payload first, then update the related client contract test and page smoke assertion. Keep payloads small but realistic, including representative Greek catalog/filter strings, leading-zero models, terminal and active statuses, DB unavailable examples, artifacts, and alert data.

Later backend prompts will add OpenAPI snapshot export and snapshot checks in the backend repositories. Those checks should complement these UI fixtures rather than replace them.
