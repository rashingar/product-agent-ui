import { NavLink, Outlet } from "react-router-dom";
import { GlobalJobsProvider } from "../../hooks/useGlobalJobs";
import { PipelineRunProvider } from "../../hooks/usePipelineRun";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/prepare", label: "Prepare" },
  { to: "/render", label: "Render" },
  { to: "/publish", label: "Publish" },
  { to: "/jobs", label: "Jobs" },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local operator dashboard</p>
          <h1>Product Agent</h1>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
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
