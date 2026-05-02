import { describe, expect, it } from "vitest";
import { CommerceApiError, commerceClient } from "../../api/commerceClient";
import {
  catalogDbImportRequiredFixtureRoutes,
  catalogProductsEmptyImportWarning,
  alertEvents,
  commerceDbUnavailableError,
  commerceDbRequiredFixtureRoutes,
  commerceFixtureRoutes,
  dbStatusMigrationMissing,
  dbStatusNotConfigured,
  dbStatusUnavailable,
  priceMonitoringExecutions,
} from "../fixtures/commerceApi";
import { installMockFetch } from "../mockFetch";

describe("commerce API client contract fixtures", () => {
  it("preserves catalog product model strings with leading zeroes", async () => {
    installMockFetch(commerceFixtureRoutes);

    const products = await commerceClient.listCatalogProducts({ page: 1, page_size: 100 });
    expect(products.items[0]).toMatchObject({
      model: "005606",
      manufacturer: "Midea",
      family: "Σπίτι",
    });
    expect(typeof products.items[0].model).toBe("string");
  });

  it("normalizes category hierarchy and brands", async () => {
    installMockFetch(commerceFixtureRoutes);

    const hierarchy = await commerceClient.getCatalogCategoryHierarchy();
    expect(hierarchy.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          family: "Σπίτι",
          categories: expect.arrayContaining([
            expect.objectContaining({
              category_name: "Κλιματισμός",
              sub_categories: expect.arrayContaining([
                expect.objectContaining({ sub_category: "Αφυγραντήρες" }),
              ]),
            }),
          ]),
        }),
      ]),
    );

    await expect(commerceClient.listCatalogBrandOptions()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ manufacturer: "Midea", count: 1 }),
        expect.objectContaining({ manufacturer: "ΓΕΡΜΑΝΟΣ", count: 1 }),
      ]),
    );
  });

  it("normalizes DB-ready status to ready for Price Monitoring", async () => {
    installMockFetch(commerceFixtureRoutes);
    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      configured: true,
      reachable: true,
      ready_for_price_monitoring: true,
      price_monitoring_requires_database: true,
      non_db_workflows_available: true,
      dialect: "postgresql",
    });
  });

  it("normalizes DB-not-configured status to not ready for Price Monitoring", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusNotConfigured,
      },
    ]);

    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      configured: false,
      reachable: false,
      ready_for_price_monitoring: false,
      price_monitoring_requires_database: true,
      non_db_workflows_available: true,
      blocking_reasons: expect.arrayContaining(["PRICEFETCHER_DATABASE_URL is not configured."]),
    });
  });

  it("normalizes DB-unreachable status to not ready for Price Monitoring", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
    ]);

    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      configured: true,
      reachable: false,
      ready_for_price_monitoring: false,
      error: "connection refused",
    });
  });

  it("normalizes missing migration/table status to not ready for Price Monitoring", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusMigrationMissing,
      },
    ]);

    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      configured: true,
      reachable: true,
      required_tables_present: false,
      alembic_up_to_date: false,
      ready_for_price_monitoring: false,
    });
  });

  it("infers old-backend DB status conservatively when ready field is absent", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: {
          configured: true,
          reachable: true,
          error: null,
          required_tables_present: true,
          alembic_up_to_date: true,
        },
      },
    ]);

    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      ready_for_price_monitoring: true,
      price_monitoring_requires_database: true,
    });

    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: {
          configured: true,
          reachable: true,
          error: null,
          required_tables_present: false,
        },
      },
    ]);

    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      ready_for_price_monitoring: false,
    });
  });

  it("normalizes run list run detail fetch status and execution history", async () => {
    installMockFetch(commerceFixtureRoutes);

    const runs = await commerceClient.listPriceMonitoringRuns();
    expect(runs[0]).toMatchObject({
      run_id: "pm-run-001",
      latest_fetch: expect.objectContaining({ status: "succeeded" }),
    });

    await expect(commerceClient.getPriceMonitoringRun("pm-run-001")).resolves.toMatchObject({
      run_id: "pm-run-001",
      latest_fetch: expect.objectContaining({ execution_id: "exec-success" }),
    });

    await expect(commerceClient.getPriceMonitoringFetch("pm-run-001")).resolves.toMatchObject({
      execution_id: "exec-success",
      status: "succeeded",
    });

    const executions = await commerceClient.listPriceMonitoringFetchExecutions("pm-run-001");
    expect(executions.map((execution) => execution.status)).toEqual(
      expect.arrayContaining(["running", "succeeded", "failed", "cancelled", "killed"]),
    );
    expect(executions).toHaveLength(priceMonitoringExecutions.length);
  });

  it("normalizes fetch logs review rows and artifact URLs", async () => {
    installMockFetch(commerceFixtureRoutes);

    await expect(commerceClient.getPriceMonitoringFetchLogs("pm-run-001")).resolves.toMatchObject({
      lines: expect.arrayContaining(["matched model 005606"]),
    });

    const review = await commerceClient.getPriceMonitoringReview("pm-run-001");
    expect(review.items[0]).toMatchObject({
      model: "005606",
      warnings: ["Competitor below own price"],
    });
    expect(review.review_csv_path).toMatchObject({
      download_url: "/commerce-api/artifacts/price-monitoring/pm-run-001/review.csv",
    });

    const artifacts = await commerceClient.listPriceMonitoringRunArtifacts("pm-run-001");
    expect(artifacts.items[0]).toMatchObject({
      download_url: "/commerce-api/artifacts/price-monitoring/pm-run-001/enriched.csv",
      can_download: true,
    });
    expect(artifacts.items[1]).toMatchObject({
      is_allowed: false,
      can_read: false,
      can_download: false,
      warning: "Path is outside configured artifact roots.",
    });
  });

  it("normalizes alert rules and events", async () => {
    installMockFetch(commerceFixtureRoutes);

    await expect(commerceClient.listPriceMonitoringAlertRules()).resolves.toMatchObject({
      count: 1,
      items: [expect.objectContaining({ model: "005606", active: true })],
    });

    await expect(commerceClient.listPriceMonitoringAlertEvents({ status: "all" })).resolves.toMatchObject({
      count: alertEvents.count,
      items: expect.arrayContaining([
        expect.objectContaining({
          model: "005606",
          status: "open",
          message: "Competitor price is below own price",
        }),
      ]),
    });
  });

  it("adds useful context for structured 503 DB-required errors", async () => {
    installMockFetch([
      ...commerceDbRequiredFixtureRoutes,
    ]);

    await expect(commerceClient.previewPriceMonitoringSelection({ source: "skroutz" })).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("PostgreSQL is required for Price Monitoring"),
    } satisfies Partial<CommerceApiError>);
  });

  it("adds Catalog-specific context for structured Catalog DB/import-required errors", async () => {
    installMockFetch(catalogDbImportRequiredFixtureRoutes);

    await expect(commerceClient.listCatalogProducts({ page: 1, page_size: 100 })).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("Catalog database/import required"),
    } satisfies Partial<CommerceApiError>);
  });

  it("preserves empty active Catalog import warnings on product responses", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/catalog/products",
        response: catalogProductsEmptyImportWarning,
      },
    ]);

    await expect(commerceClient.listCatalogProducts({ page: 1, page_size: 100 })).resolves.toMatchObject({
      items: [],
      warning: "Active catalog is empty. Run python -m pricefetcher.jobs.ingest_catalog.",
    });
  });

  it("does not treat DB-not-ready as the commerce backend being fully down", async () => {
    installMockFetch([
      { method: "GET", path: "/commerce-api/health", response: { status: "ok", service: "price-fetcher" } },
      { method: "GET", path: "/commerce-api/price-monitoring/db/status", response: dbStatusUnavailable },
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/runs",
        response: commerceDbUnavailableError,
      },
    ]);

    await expect(commerceClient.getCommerceHealth()).resolves.toMatchObject({ status: "ok" });
    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      ready_for_price_monitoring: false,
      non_db_workflows_available: true,
    });
    await expect(commerceClient.listPriceMonitoringRuns()).rejects.toMatchObject({
      status: 503,
    } satisfies Partial<CommerceApiError>);
  });
});
