import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CatalogPage } from "../pages/CatalogPage";
import { CsvBridgePage } from "../pages/CsvBridgePage";
import { DashboardPage } from "../pages/DashboardPage";
import { FiltersManagerPage } from "../pages/FiltersManagerPage";
import { JobDetailPage } from "../pages/JobDetailPage";
import { JobsPage } from "../pages/JobsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PipelineJobPage } from "../pages/PipelineJobPage";
import { PrepareJobPage } from "../pages/PrepareJobPage";
import { PriceMonitoringAlertsPage } from "../pages/PriceMonitoringAlertsPage";
import { PriceMonitoringExecutionsPage } from "../pages/PriceMonitoringExecutionsPage";
import { PriceMonitoringPage } from "../pages/PriceMonitoringPage";
import { ProductAgentWorkflowPage } from "../pages/ProductAgentWorkflowPage";
import { PublishJobPage } from "../pages/PublishJobPage";
import { RenderJobPage } from "../pages/RenderJobPage";
import { SourceUrlCandidatesPage } from "../pages/SourceUrlCandidatesPage";

const routes = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "catalog/source-url-candidates", element: <SourceUrlCandidatesPage /> },
      { path: "csv-bridge", element: <CsvBridgePage /> },
      { path: "price-monitoring", element: <PriceMonitoringPage /> },
      { path: "price-monitoring/executions", element: <PriceMonitoringExecutionsPage /> },
      { path: "price-monitoring/alerts", element: <PriceMonitoringAlertsPage /> },
      { path: "product-agent", element: <ProductAgentWorkflowPage /> },
      { path: "product-agent/filters", element: <FiltersManagerPage /> },
      { path: "pipeline", element: <PipelineJobPage /> },
      { path: "prepare", element: <PrepareJobPage /> },
      { path: "render", element: <RenderJobPage /> },
      { path: "publish", element: <PublishJobPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/:jobId", element: <JobDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export function renderWithRouter(initialPath = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}
