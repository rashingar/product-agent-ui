import { Link } from "react-router-dom";
import { formatDateTime, getJobIdentifier, getJobStageLabel, getJobStatus } from "../../api/jobUtils";
import type { Job } from "../../api/types";
import { StatusBadge } from "./StatusBadge";

interface JobTableProps {
  jobs: Job[];
}

export function JobTable({ jobs }: JobTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Stage</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => {
            const jobId = getJobIdentifier(job);
            const rowKey = jobId ?? `job-${index}`;
            return (
              <tr key={rowKey}>
                <td>
                  {jobId ? (
                    <Link to={`/jobs/${encodeURIComponent(jobId)}`}>{jobId}</Link>
                  ) : (
                    <span className="muted">Missing id</span>
                  )}
                </td>
                <td>{getJobStageLabel(job)}</td>
                <td>
                  <StatusBadge status={getJobStatus(job)} />
                </td>
                <td>{formatDateTime(job.created_at)}</td>
                <td>{formatDateTime(job.updated_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
