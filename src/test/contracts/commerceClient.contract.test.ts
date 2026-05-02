import { describe, expect, it } from "vitest";
import { CommerceApiError, commerceClient } from "../../api/commerceClient";
import {
  alertEvents,
  commerceDbUnavailableError,
  commerceFixtureRoutes,
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

  it("normalizes DB status for reachable and unavailable states", async () => {
    installMockFetch(commerceFixtureRoutes);
    await expect(commerceClient.getPriceMonitoringDbStatus()).resolves.toMatchObject({
      configured: true,
      reachable: true,
      dialect: "postgresql",
    });

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
      error: "connection refused",
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

  it("adds useful context for 503 DB-unavailable errors", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/runs",
        response: commerceDbUnavailableError,
      },
    ]);

    await expect(commerceClient.listPriceMonitoringRuns()).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("DB persistence may be disabled or unreachable"),
    } satisfies Partial<CommerceApiError>);
  });
});
