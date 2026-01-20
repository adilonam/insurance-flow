"use client";

import { useState } from "react";
import { InternalDashboardHeader } from "./_components/internal-dashboard-header";
import { ClaimWorkflowCards } from "./_components/claim-workflow-cards";
import { ClaimsQueuePanel } from "./_components/triage-queue-panel";

export default function Page() {
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING_TRIAGE");

  return (
    <div className="@container/main flex flex-col gap-6">
      <InternalDashboardHeader />
      <ClaimWorkflowCards selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
      <ClaimsQueuePanel status={selectedStatus} />
    </div>
  );
}
