"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNextStatus, getPreviousStatus } from "../../_components/case-statuses";
import { useRouter } from "next/navigation";

interface StatusNavigationProps {
  currentStatusId: string;
  caseId: string;
}

export function StatusNavigation({ currentStatusId, caseId }: StatusNavigationProps) {
  const router = useRouter();
  const nextStatus = getNextStatus(currentStatusId);
  const previousStatus = getPreviousStatus(currentStatusId);

  const handleStatusChange = (newStatusId: string | null) => {
    if (!newStatusId) return;
    // In a real app, this would update the case status via API
    // For now, we'll just show an alert
    alert(`Status would be updated to: ${newStatusId}\n\nIn production, this would call an API to update the case.`);
    // router.refresh(); // Refresh to show updated status
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => handleStatusChange(previousStatus)}
        disabled={!previousStatus}
      >
        <ChevronLeft className="size-4" />
        Previous Status
      </Button>
      <Button
        variant="default"
        onClick={() => handleStatusChange(nextStatus)}
        disabled={!nextStatus}
      >
        Next Status
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

