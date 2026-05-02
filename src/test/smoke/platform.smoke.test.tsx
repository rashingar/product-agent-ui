import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PRICE_MONITORING_STATE_KEY,
  initialPriceMonitoringWorkflowState,
} from "../../api/priceMonitoringUtils";
import { dbStatusUnavailable, commerceFixtureRoutes } from "../fixtures/commerceApi";
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
  });

  it("renders Price Monitoring workflow with DB status and run list", async () => {
    installMockFetch(allRoutes);

    renderWithRouter("/price-monitoring");

    await expect(screen.findByRole("heading", { name: "Competitor price workflow" })).resolves.toBeInTheDocument();
    await expect(screen.findAllByText("Database available")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("pm-run-001")).resolves.toBeInTheDocument();
    expect(screen.getByText("exec-success")).toBeInTheDocument();
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
    await expect(screen.findAllByText("Database available")).resolves.not.toHaveLength(0);
    await expect(screen.findByText("Competitor price is below own price")).resolves.toBeInTheDocument();
    expect(screen.getByText("005606 below own price")).toBeInTheDocument();
  });

  it("renders Price Monitoring Alerts DB-unavailable state", async () => {
    installMockFetch([
      {
        method: "GET",
        path: "/commerce-api/price-monitoring/db/status",
        response: dbStatusUnavailable,
      },
      ...allRoutes,
    ]);

    renderWithRouter("/price-monitoring/alerts");

    await expect(screen.findAllByText("Database unavailable")).resolves.not.toHaveLength(0);
    expect(screen.getByText("Not reachable")).toBeInTheDocument();
    expect(screen.getByText("connection refused")).toBeInTheDocument();
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
