import { NavLink, Outlet, useLocation } from "react-router-dom";
import { GlobalJobsProvider } from "../../hooks/useGlobalJobs";
import { PipelineRunProvider } from "../../hooks/usePipelineRun";

const platformNavItems = [
  { to: "/", label: "Dashboard" },
  { to: "/catalog", label: "Catalog" },
  { to: "/csv-bridge", label: "CSV/Bridge" },
  { to: "/price-monitoring", label: "Price Monitoring" },
  { to: "/price-monitoring/alerts", label: "Price Alerts" },
  { to: "/product-agent", label: "Product-Agent" },
];

const productAgentNavItems = [
  { to: "/product-agent", label: "Workflow" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/prepare", label: "Prepare" },
  { to: "/render", label: "Render" },
  { to: "/publish", label: "Publish" },
  { to: "/jobs", label: "Jobs" },
];

const productAgentPaths = new Set([
  "/product-agent",
  "/pipeline",
  "/prepare",
  "/render",
  "/publish",
  "/jobs",
]);

const priceMonitoringNavItems = [
  { to: "/price-monitoring", label: "Workflow" },
  { to: "/price-monitoring/executions", label: "Executions" },
  { to: "/price-monitoring/alerts", label: "Alerts" },
];

export function AppShell() {
  const location = useLocation();
  const isProductAgentSection =
    productAgentPaths.has(location.pathname) || location.pathname.startsWith("/jobs/");
  const isPriceMonitoringSection = location.pathname.startsWith("/price-monitoring");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local commerce operations</p>
          <h1>Product Agent Platform</h1>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          {platformNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                const isProductAgentActive =
                  item.to === "/product-agent" && isProductAgentSection;
                const isPriceMonitoringActive =
                  item.to === "/price-monitoring" && isPriceMonitoringSection;
                return isActive || isProductAgentActive || isPriceMonitoringActive
                  ? "nav-link active"
                  : "nav-link";
              }}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {isProductAgentSection ? (
        <nav className="subnav" aria-label="Product-Agent navigation">
          {productAgentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "subnav-link active" : "subnav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
      {isPriceMonitoringSection ? (
        <nav className="subnav price-monitoring-subnav" aria-label="Price Monitoring navigation">
          {priceMonitoringNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/price-monitoring"}
              className={({ isActive }) => (isActive ? "subnav-link active" : "subnav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
      <GlobalJobsProvider>
        <PipelineRunProvider>
          <main className="main-content">
            <Outlet />
          </main>
        </PipelineRunProvider>
      </GlobalJobsProvider>
    </div>
  );
}
