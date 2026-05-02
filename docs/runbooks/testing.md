# Testing Runbook

Install dependencies:

```bash
npm install
```

Build production assets:

```bash
npm run build
```

Run fast mocked checks:

```bash
npm run test:fast
```

Run API client contract fixture tests only:

```bash
npm run test:contracts
```

Run page-level smoke tests only:

```bash
npm run test:smoke
```

## Coverage

`test:contracts` calls the UI API clients directly with mocked Product-Agent and commerce responses. It checks client normalization, preserved status/model values, Filters Manager `expected_revision` write bodies, artifact URL conversion, Price Monitoring DB readiness states, structured DB-required 503 errors, and useful API error messages.

`test:smoke` renders key operator pages with mocked backend responses and asserts headings, navigation, core rows, status text, and critical page shells. It verifies Price Monitoring workflow, execution history, and alerts lock when PostgreSQL is not ready, while Catalog and CSV/Bridge still render. Filters Manager smoke coverage also verifies the loaded revision display, successful write revision updates, stale 409 conflict messaging, no silent write retry, and reload-category behavior.

`test:fixture-contracts` compares mocked fixture routes against the backend OpenAPI snapshots. It keeps `/commerce-api` to `/api` normalization, checks Price Monitoring DB status fixture fields, and validates structured DB-required 503 fixtures. For Product-Agent Filters Manager, it checks revision fields on response fixtures and `expected_revision` awareness on the group/value write request examples.

`test:fast` runs both contract and smoke suites once in Vitest/jsdom.

## Intentional Limits

These tests do not require Product-Agent or price-fetcher to be running. They do not use live network calls, real CSV files, local Windows paths, PostgreSQL, OpenCart, OpenAI, backend subprocesses, or browser end-to-end tooling.

PostgreSQL is mandatory for live Price Monitoring workflows, alerts, and execution history. In
mocked tests, DB-not-ready is represented as a Price Monitoring blocking condition only; it must
not imply the commerce health, Catalog, CSV/Bridge, files, paths, or artifacts APIs are down.

For Filters Manager, a 409 stale revision response means the backend rejected a write because the category changed after the UI loaded it. The operator path is to reload the category, inspect the current values, and save again with the new backend revision token.

Real cross-repo integration checks and backend OpenAPI snapshot exports/checks are separate later tasks.
