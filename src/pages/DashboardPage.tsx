import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, getApiErrorMessage } from "../api/client";
import type { HealthResponse } from "../api/types";
import { ErrorState, LoadingState } from "../components/layout/StateBlocks";
import { JsonBlock } from "../components/jobs/JsonBlock";

function getHealthStatus(health: HealthResponse | null): string {
  if (!health) {
    return "unknown";
  }

  if (typeof health.status === "string") {
    return health.status;
  }

  if (typeof health.ok === "boolean") {
    return health.ok ? "ok" : "not ok";
  }

  return "unknown";
}

export function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const nextHealth = await apiClient.getHealth(signal);
      if (signal?.aborted) {
        return;
      }

      setHealth(nextHealth);
      setError(null);
    } catch (healthError) {
      if (!signal?.aborted) {
        setError(getApiErrorMessage(healthError));
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHealth(controller.signal);
    return () => controller.abort();
  }, [loadHealth]);

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h2>Local backend control surface</h2>
        <p>API base URL: {apiClient.apiBaseUrl}</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Backend health</p>
            <h3>{getHealthStatus(health)}</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void loadHealth()}>
            Refresh
          </button>
        </div>
        {isLoading ? <LoadingState label="Checking backend health..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void loadHealth()} /> : null}
        {!isLoading && !error ? <JsonBlock value={health} /> : null}
      </section>

      <section className="quick-links" aria-label="Quick links">
        <Link className="quick-link" to="/prepare">
          <strong>Prepare</strong>
          <span>Create a prepare job</span>
        </Link>
        <Link className="quick-link" to="/render">
          <strong>Render</strong>
          <span>Create a render job</span>
        </Link>
        <Link className="quick-link" to="/publish">
          <strong>Publish</strong>
          <span>Create a publish job</span>
        </Link>
        <Link className="quick-link" to="/jobs">
          <strong>Jobs</strong>
          <span>Review recent jobs</span>
        </Link>
      </section>
    </div>
  );
}
