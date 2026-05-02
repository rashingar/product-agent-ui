import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PRICE_MONITORING_STATE_KEY,
  initialPriceMonitoringWorkflowState,
} from "../../api/priceMonitoringUtils";
import {
  catalogDbImportRequiredFixtureRoutes,
  catalogProductsEmptyImportWarning,
  commerceDbRequiredFixtureRoutes,
  commerceFixtureRoutes,
  dbStatusUnavailable,
} from "../fixtures/commerceApi";
import { productAgentFilterRevision, productAgentFixtureRoutes } from "../fixtures/productAgentApi";
import { installMockFetch } from "../mockFetch";
import { renderWithRouter } from "../renderWithRouter";

const allRoutes = [...productAgentFixtureRoutes, ...commerceFixtureRoutes];

describe("platform mocked page smoke tests", () => {
  it("renders the app shell and main platform navigation", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/");

    expect(screen.getByRole("heading", { name: "Product Agent Platform" })).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(primaryNav).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: "Catalog" })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: "Price Monitoring" })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: "Product-Agent" })).toBeInTheDocument();
    await expect(screen.findByRole("heading", { name: "Local backend control surface" })).resolves.toBeInTheDocument();
  });

  it("renders Dashboard with mocked health and diagnostics responses", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/");

    await expect(screen.findByRole("heading", { name: "ok" })).resolves.toBeInTheDocument();
    await expect(screen.findByText(/Product-Agent API health endpoint responded/)).resolves.toBeInTheDocument();
    await expect(screen.findByText(/Commerce API health endpoint responded/)).resolves.toBeInTheDocument();
  });

  it("renders Catalog summary filters and product rows", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/catalog");

    await expect(screen.findByRole("heading", { name: "Commerce catalog" })).resolves.toBeInTheDocument();
    await expect(screen.findByText("005606")).resolves.toBeInTheDocument();
    await expect(screen.findByText("Midea Αφυγραντήρας 20L")).resolves.toBeInTheDocument();
    expect(screen.getByText("Αφυγραντήρες")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Source URLs for 005606" })).toBeInTheDocument();
    await expect(screen.findByText("Source URL Import")).resolves.toBeInTheDocument();
    await expect(screen.findByText(/Coverage:/)).resolves.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview import" })).not.toBeInTheDocument();
  });

  it("expands source URL import and keeps apply guarded by preview and confirmation", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/catalog");

    await expect(screen.findByText("Source URL Import")).resolves.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview import" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand" }));

    await expect(screen.findByText("Total URLs")).resolves.toBeInTheDocument();
    const applyButton = screen.getByRole("button", { name: "Apply import" });
    expect(applyButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Preview import" }));

    await expect(screen.findByText("Dry-run report")).resolves.toBeInTheDocument();
    await expect(screen.findByText("Ambiguous identity for artifact row model MIXED-001.")).resolves.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply import" })).toBeDisabled();

    fireEvent.click(screen.getByLabelText("I reviewed the dry-run report"));

    await waitFor(() => expect(screen.getByRole("button", { name: "Apply import" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Apply import" }));

    await expect(screen.findByText("Applied import report")).resolves.toBeInTheDocument();
    expect(screen.getAllByText("Imported").length).toBeGreaterThan(0);
  });

  it("opens and closes the Catalog source URL drawer with product context", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/catalog");

    fireEvent.click(await screen.findByRole("button", { name: "Source URLs for 005606" }));

    let drawer = await screen.findByRole("dialog", { name: "Source URLs" });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("005606")).toBeInTheDocument();
    expect(within(drawer).getByText("Midea Αφυγραντήρας 20L")).toBeInTheDocument();
    expect(within(drawer).getByText("Midea")).toBeInTheDocument();
    expect(within(drawer).getByText("MD-20L")).toBeInTheDocument();
    expect(within(drawer).getByText("1")).toBeInTheDocument();
    await expect(within(drawer).findByText("https://www.skroutz.gr/s/123/midea-md-20l.html")).resolves.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Source URLs" })).not.toBeInTheDocument());
  });

  it("supports adding validating editing and promoting source URLs in the drawer", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/catalog");

    fireEvent.click(await screen.findByRole("button", { name: "Source URLs for 005606" }));
    let drawer = await screen.findByRole("dialog", { name: "Source URLs" });
    await expect(within(drawer).findByText("https://www.skroutz.gr/s/123/midea-md-20l.html")).resolves.toBeInTheDocument();
    expect(within(drawer).getByText("needs review")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Promote to active" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.change(within(drawer).getByLabelText(/Edit URL for https:\/\/www\.skroutz\.gr/), {
      target: { value: "https://www.public.gr/product/midea-md-20l-edited" },
    });
    fireEvent.click(within(drawer).getByRole("button", { name: "Save" }));

    drawer = await screen.findByRole("dialog", { name: "Source URLs" });
    await expect(within(drawer).findByText("https://www.public.gr/product/midea-md-20l-edited")).resolves.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "Promote to active" }));
    drawer = await screen.findByRole("dialog", { name: "Source URLs" });
    await waitFor(() => expect(within(drawer).queryByRole("button", { name: "Promote to active" })).not.toBeInTheDocument());
    expect(within(drawer).getAllByText("active").length).toBeGreaterThan(1);

    fireEvent.change(within(drawer).getByLabelText("Manual URL"), {
      target: { value: "https://www.public.gr/product/midea-md-20l" },
    });
    fireEvent.change(within(drawer).getByLabelText("Source"), {
      target: { value: "public" },
    });
    fireEvent.click(within(drawer).getByRole("button", { name: "Add URL" }));

    await expect(within(drawer).findByText("https://www.public.gr/product/midea-md-20l")).resolves.toBeInTheDocument();

    fireEvent.click(within(drawer).getAllByRole("button", { name: "Validate" })[1]);

    await expect(screen.findAllByText("URL returned HTTP 404.")).resolves.not.toHaveLength(0);
    await expect(screen.findAllByText("broken")).resolves.not.toHaveLength(0);
  });

  it("shows Catalog database/import-required state for structured Catalog 503 responses", async () => {
    installMockFetch([...catalogDbImportRequiredFixtureRoutes, ...allRoutes]);

    renderWithRouter("/catalog");

    await expect(screen.findByRole("heading", { name: "Catalog database/import required" })).resolves.toBeInTheDocument();
    expect(screen.getAllByText(/Catalog database\/import required/).length).toBeGreaterThan(0);
    expect(screen.getByText("Run alembic upgrade head.")).toBeInTheDocument();
    expect(screen.getByText("Run python -m pricefetcher.jobs.ingest_catalog.")).toBeInTheDocument();
    expect(screen.getByText(/CSV\/Bridge, files, paths, artifacts, or general commerce health/)).toBeInTheDocument();
    expect(screen.queryByText(/Commerce API unreachable/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview selection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create price monitoring run" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByRole("button", { name: "Preview import" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply import" })).toBeDisabled();
    expect(screen.getByText("Source URL import is locked until Catalog database/import readiness is restored.")).toBeInTheDocument();
  });

  it("shows Catalog import-required language for empty successful Catalog product warnings", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/catalog/products",
        response: catalogProductsEmptyImportWarning,
      },
      ...allRoutes,
    ]);

    renderWithRouter("/catalog");

    await expect(screen.findByRole("heading", { name: "Catalog database/import required" })).resolves.toBeInTheDocument();
    expect(screen.getByText("Active catalog is empty or the catalog import is missing.")).toBeInTheDocument();
    expect(screen.getByText("Run python -m pricefetcher.jobs.ingest_catalog.")).toBeInTheDocument();
  });

  it("renders Price Monitoring workflow with DB status and run list", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/price-monitoring");

    await expect(screen.findByRole("heading", { name: "Competitor price workflow" })).resolves.toBeInTheDocument();
    await expect(screen.findAllByText("Database ready")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("pm-run-001")).resolves.toBeInTheDocument();
    expect(screen.getByText("exec-success")).toBeInTheDocument();
  });

  it("shows the Price Monitoring DB-required banner and disables primary actions when DB is not ready", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...commerceDbRequiredFixtureRoutes,
      ...allRoutes,
    ]);

    renderWithRouter("/price-monitoring");

    await expect(
      screen.findAllByText(
        "PostgreSQL is required for Price Monitoring. CSV/Bridge, files, paths, artifacts, and general commerce health may still be available.",
      ),
    ).resolves.not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create run" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fetch prices" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Load review" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export OpenCart price update CSV" })).toBeDisabled();
  });

  it("enables Price Monitoring primary actions when DB is ready", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/price-monitoring");

    await expect(screen.findAllByText("Database ready")).resolves.not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Create run" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Fetch prices" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Load review" })).toBeEnabled();
  });

  it("renders Price Monitoring Executions for a selected run", async () => {
    window.sessionStorage.setItem(
      PRICE_MONITORING_STATE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          ...initialPriceMonitoringWorkflowState,
          currentRunId: "pm-run-001",
          currentExecutionId: "exec-success",
        },
      }),
    );
    installMockFetch(allRoutes);

    renderWithRouter("/price-monitoring/executions");

    await expect(screen.findByRole("heading", { name: "Fetch executions" })).resolves.toBeInTheDocument();
    await expect(screen.findByText("exec-success")).resolves.toBeInTheDocument();
    expect(screen.getByText("exec-killed")).toBeInTheDocument();
    expect(screen.getAllByText("Succeeded").length).toBeGreaterThan(0);
  });

  it("renders Price Monitoring Alerts available rules and events", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/price-monitoring/alerts");

    await expect(screen.findByRole("heading", { name: "Price Monitoring Alerts" })).resolves.toBeInTheDocument();
    await expect(screen.findAllByText("Database ready")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("Competitor price is below own price")).resolves.toBeInTheDocument();
    expect(screen.getByText("005606 below own price")).toBeInTheDocument();
  });

  it("renders Price Monitoring Executions DB-required state", async () => {
    window.sessionStorage.setItem(
      PRICE_MONITORING_STATE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          ...initialPriceMonitoringWorkflowState,
          currentRunId: "pm-run-001",
          currentExecutionId: "exec-success",
        },
      }),
    );
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...commerceDbRequiredFixtureRoutes,
      ...allRoutes,
    ]);

    renderWithRouter("/price-monitoring/executions");

    await expect(screen.findByRole("heading", { name: "Fetch executions" })).resolves.toBeInTheDocument();
    await expect(screen.findAllByText("Database not ready")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("Execution history locked")).resolves.toBeInTheDocument();
  });

  it("renders Price Monitoring Alerts DB-required state", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...commerceDbRequiredFixtureRoutes,
      ...allRoutes,
    ]);

    renderWithRouter("/price-monitoring/alerts");

    await expect(screen.findAllByText("Database not ready")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("Alert events locked")).resolves.toBeInTheDocument();
    expect(screen.getByText("Not reachable")).toBeInTheDocument();
    expect(screen.getAllByText("connection refused").length).toBeGreaterThan(0);
  });

  it("keeps Catalog usable when Price Monitoring DB is not ready", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...commerceDbRequiredFixtureRoutes,
      ...allRoutes,
    ]);

    renderWithRouter("/catalog");

    await expect(screen.findByRole("heading", { name: "Commerce catalog" })).resolves.toBeInTheDocument();
    await expect(screen.findByText("005606")).resolves.toBeInTheDocument();
    expect(screen.queryByText("Database not ready")).not.toBeInTheDocument();
  });

  it("keeps CSV/Bridge usable when Price Monitoring DB is not ready", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...commerceDbRequiredFixtureRoutes,
      ...allRoutes,
    ]);

    renderWithRouter("/csv-bridge");

    await expect(screen.findByRole("heading", { name: "CSV bridge workspace" })).resolves.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Safe file browser" })).toBeInTheDocument();
    expect(screen.queryByText("Database not ready")).not.toBeInTheDocument();
  });

  it("renders Jobs with active and terminal statuses", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/jobs");

    await expect(screen.findByRole("heading", { name: "Recent jobs" })).resolves.toBeInTheDocument();
    await expect(screen.findByText("job-queued-1")).resolves.toBeInTheDocument();
    expect(screen.getByText("job-running-1")).toBeInTheDocument();
    expect(screen.getByText("job-succeeded-1")).toBeInTheDocument();
    expect(screen.getByText("job-failed-1")).toBeInTheDocument();
    expect(screen.getByText("job-cancelled-1")).toBeInTheDocument();
    expect(screen.getByText("job-killed-1")).toBeInTheDocument();
  });

  it("renders Filters Manager categories and selected category detail", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/product-agent/filters?category_id=310");

    await expect(screen.findByRole("heading", { name: "Filters Manager" })).resolves.toBeInTheDocument();
    await expect(screen.findByRole("heading", { name: "Filters API ready" })).resolves.toBeInTheDocument();
    await expect(screen.findByText(`Revision ${productAgentFilterRevision.slice(0, 12)}`)).resolves.toBeInTheDocument();
    await expect(screen.findByText("Χωρητικότητα")).resolves.toBeInTheDocument();
    expect(screen.getAllByText("Αφυγραντήρες").length).toBeGreaterThan(0);
    expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
  });

  it("renders Product-Agent Workflow initial shell without backend side effects", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/product-agent");

    await expect(screen.findByRole("heading", { name: "Workflow shell" })).resolves.toBeInTheDocument();
    await expect(screen.findByText("Product-Agent API available")).resolves.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prepare" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Authoring" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Filter Review" })).toBeInTheDocument();
  });
});
