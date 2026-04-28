import { NavLink, Outlet, useLocation } from "react-router-dom";
import { GlobalJobsProvider } from "../../hooks/useGlobalJobs";
import { PipelineRunProvider } from "../../hooks/usePipelineRun";

const platformNavItems = [
  { to: "/", label: "Dashboard" },
  { to: "/catalog", label: "Catalog" },
  { to: "/product-agent", label: "Product-Agent" },
];

const productAgentNavItems = [
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

export function AppShell() {
  const location = useLocation();
  const isProductAgentSection =
    productAgentPaths.has(location.pathname) || location.pathname.startsWith("/jobs/");

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
                return isActive || isProductAgentActive ? "nav-link active" : "nav-link";
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
