import { apiClient } from "../api/client";
import { PrepareJobForm } from "../components/forms/PrepareJobForm";
import { useCreateJob } from "../hooks/useCreateJob";

export function PrepareJobPage() {
  const { error, isSubmitting, submitJob } = useCreateJob(apiClient.createPrepareJob);

  return (
    <div className="page-stack narrow">
      <section className="page-header">
        <p className="eyebrow">Prepare</p>
        <h2>Start prepare job</h2>
      </section>
      <section className="panel">
        <PrepareJobForm error={error} isSubmitting={isSubmitting} onSubmit={submitJob} />
      </section>
    </div>
  );
}
