import { InternalDashboardHeader } from "./_components/internal-dashboard-header";
import { ClaimWorkflowCards } from "./_components/claim-workflow-cards";
import { TriageQueuePanel } from "./_components/triage-queue-panel";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-6">
      <InternalDashboardHeader />
      <ClaimWorkflowCards />
      <TriageQueuePanel />
    </div>
  );
}
