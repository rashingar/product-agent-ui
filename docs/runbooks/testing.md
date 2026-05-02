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

`test:contracts` calls the UI API clients directly with mocked Product-Agent and commerce responses. It checks client normalization, preserved status/model values, artifact URL conversion, DB unavailable errors, and useful API error messages.

`test:smoke` renders key operator pages with mocked backend responses and asserts headings, navigation, core rows, status text, and critical page shells.

`test:fast` runs both contract and smoke suites once in Vitest/jsdom.

## Intentional Limits

These tests do not require Product-Agent or price-fetcher to be running. They do not use live network calls, real CSV files, local Windows paths, PostgreSQL, OpenCart, OpenAI, backend subprocesses, or browser end-to-end tooling.

Real cross-repo integration checks and backend OpenAPI snapshot exports/checks are separate later tasks.
