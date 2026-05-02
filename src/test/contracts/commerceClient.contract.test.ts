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
  sourceUrlImportApply,
  sourceUrlImportPreview,
  sourceUrlSummary,
  sourceUrlValidationSuccess,
  sourceUrlsForCatalogProduct,
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
    expect(products.items[0].catalog_product_id).toBe(1);
  });

  it("lists creates updates and validates Catalog source URLs", async () => {
    installMockFetch([
      ...commerceFixtureRoutes,
      {
        method: "POST",
        path: "/commerce-api/catalog/source-urls/102/validate",
        response: sourceUrlValidationSuccess,
      },
    ]);

    await expect(commerceClient.listCatalogProductSourceUrls(1)).resolves.toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({
          id: 101,
          catalog_product_id: 1,
          url: sourceUrlsForCatalogProduct.items[0].url,
          status: "active",
          url_type: "manual",
        }),
        expect.objectContaining({
          id: 102,
          status: "needs_review",
          url_type: "imported",
        }),
      ]),
    });

    await expect(
      commerceClient.createCatalogProductSourceUrl(1, {
        url: "https://www.public.gr/product/midea-md-20l",
        url_type: "manual",
      }),
    ).resolves.toMatchObject({
      catalog_product_id: 1,
      status: "active",
      url_type: "manual",
    });

    await expect(commerceClient.updateCatalogSourceUrl(101, { status: "disabled" })).resolves.toMatchObject({
      id: 101,
      status: "disabled",
    });

    await expect(commerceClient.validateCatalogSourceUrl(102)).resolves.toMatchObject({
      item: expect.objectContaining({ status: "active" }),
      validation: expect.objectContaining({ status: "success", http_status_code: 200 }),
    });
  });

  it("loads source URL summary and import preview/apply reports", async () => {
    installMockFetch(commerceFixtureRoutes);

    await expect(commerceClient.getSourceUrlSummary()).resolves.toMatchObject({
      total_count: sourceUrlSummary.total_count,
      active_count: sourceUrlSummary.active_count,
      needs_review_count: sourceUrlSummary.needs_review_count,
      by_status: expect.objectContaining({ active: 1 }),
      products_with_urls_count: sourceUrlSummary.products_with_active_source_urls,
      products_without_urls_count: sourceUrlSummary.products_without_active_source_urls,
      by_type: expect.objectContaining({ imported: 1 }),
      by_source: expect.objectContaining({ bestprice: 1 }),
    });

    const body = {
      catalog_source: "sourceCata",
      include_observations: true,
      include_artifacts: true,
      include_legacy_runs: false,
      report_item_limit: 200,
    };

    await expect(commerceClient.previewSourceUrlImport(body)).resolves.toMatchObject({
      apply: false,
      summary: expect.objectContaining({
        candidates_found: sourceUrlImportPreview.candidates_found,
        would_import_count: sourceUrlImportPreview.imported_count,
      }),
      report_items: expect.arrayContaining([
        expect.objectContaining({ action: "created", status: "active", model: "005606" }),
      ]),
    });

    await expect(commerceClient.applySourceUrlImport(body)).resolves.toMatchObject({
      apply: true,
      summary: expect.objectContaining({
        imported_count: sourceUrlImportApply.imported_count,
      }),
      changed_source_urls: expect.arrayContaining([
        expect.objectContaining({ action: "created" }),
      ]),
    });
  });

  it("normalizes malformed source URL payloads to stable empty shapes", async () => {
    installMockFetch([
      { method: "GET", path: "/commerce-api/catalog/products/1/source-urls", response: { items: [null, { nope: true }] } },
      { method: "GET", path: "/commerce-api/catalog/source-urls/summary", response: null },
      { method: "POST", path: "/commerce-api/catalog/source-urls/import/preview", response: { report_items: [null, "bad"] } },
    ]);

    await expect(commerceClient.listCatalogProductSourceUrls(1)).resolves.toMatchObject({
      items: [],
      count: 0,
    });
    await expect(commerceClient.getSourceUrlSummary()).resolves.toMatchObject({
      total_count: 0,
      active_count: 0,
    });
    await expect(commerceClient.previewSourceUrlImport({})).resolves.toMatchObject({
      apply: false,
      summary: expect.objectContaining({ candidates_found: 0, skipped_count: 0 }),
      report_items: [],
    });
  });

  it("keeps CommerceApiError path and message useful for source URL errors", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/catalog/products/1/source-urls",
        response: { status: 500, body: { detail: "Source URL query failed." } },
      },
    ]);

    await expect(commerceClient.listCatalogProductSourceUrls(1)).rejects.toMatchObject({
      status: 500,
      path: "/catalog/products/1/source-urls",
      message: expect.stringContaining("Source URL query failed"),
    } satisfies Partial<CommerceApiError>);
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
