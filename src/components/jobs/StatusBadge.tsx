interface StatusBadgeProps {
  status: string;
}

function getStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (["succeeded", "success", "completed", "done"].includes(normalized)) {
    return "success";
  }

  if (["failed", "failure", "error", "cancelled", "canceled"].includes(normalized)) {
    return "danger";
  }

  if (["queued", "pending"].includes(normalized)) {
    return "queued";
  }

  if (["running", "in_progress", "preparing", "rendering", "publishing"].includes(normalized)) {
    return "active";
  }

  return "neutral";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${getStatusTone(status)}`}>{status}</span>;
}
