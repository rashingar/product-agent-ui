import { JobTable } from "../components/jobs/JobTable";
import { EmptyState, ErrorState, LoadingState } from "../components/layout/StateBlocks";
import { useJobs } from "../hooks/useJobs";

export function JobsPage() {
  const { error, isLoading, isPolling, isRefreshing, jobs, lastLoadedAt, reload } = useJobs();

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Jobs</p>
        <h2>Recent jobs</h2>
        <p>
          {isPolling
            ? "Polling active jobs every 2.5 seconds."
            : "Polling stops when no queued or running jobs are present."}
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Job list</p>
            <h3>{jobs.length} jobs</h3>
          </div>
          <button className="button secondary" type="button" onClick={() => void reload()}>
            Refresh
          </button>
        </div>

        {lastLoadedAt ? (
          <p className="muted">Last loaded {lastLoadedAt.toLocaleTimeString()}</p>
        ) : null}
        {isRefreshing ? <p className="muted">Refreshing active jobs...</p> : null}

        {isLoading ? <LoadingState label="Loading jobs..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}
        {!isLoading && !error && jobs.length === 0 ? (
          <EmptyState title="No jobs found" message="The backend returned an empty job list." />
        ) : null}
        {!isLoading && !error && jobs.length > 0 ? <JobTable jobs={jobs} /> : null}
      </section>
    </div>
  );
}
