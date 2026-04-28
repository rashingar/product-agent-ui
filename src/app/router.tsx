import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CatalogPage } from "../pages/CatalogPage";
import { CsvBridgePage } from "../pages/CsvBridgePage";
import { DashboardPage } from "../pages/DashboardPage";
import { JobDetailPage } from "../pages/JobDetailPage";
import { JobsPage } from "../pages/JobsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PipelineJobPage } from "../pages/PipelineJobPage";
import { PrepareJobPage } from "../pages/PrepareJobPage";
import { PublishJobPage } from "../pages/PublishJobPage";
import { RenderJobPage } from "../pages/RenderJobPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "csv-bridge", element: <CsvBridgePage /> },
      { path: "product-agent", element: <JobsPage /> },
      { path: "pipeline", element: <PipelineJobPage /> },
      { path: "prepare", element: <PrepareJobPage /> },
      { path: "render", element: <RenderJobPage /> },
      { path: "publish", element: <PublishJobPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/:jobId", element: <JobDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
