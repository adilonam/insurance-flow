"use client";

import { Check, Circle } from "lucide-react";
import { CASE_STATUSES, getStatusById } from "../../_components/status-mapper";
import { cn } from "@/lib/utils";

interface CaseTimelineProps {
  currentStatusId: string;
  statusHistory?: Array<{ status: string; dateTime: string; description?: string }>;
}

export function CaseTimeline({ currentStatusId, statusHistory = [] }: CaseTimelineProps) {
  const completedStatusIds = new Set(statusHistory.map((h) => h.status));
  const currentStatus = getStatusById(currentStatusId);
  const currentOrder = currentStatus?.order ?? 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Case Progress Timeline</h3>
      <div className="overflow-x-auto pb-6">
        <div className="relative flex min-w-max gap-4 px-8">
          {/* Base horizontal timeline line */}
          <div className="bg-muted absolute top-3 right-8 left-8 h-0.5" />

          {CASE_STATUSES.map((status, index) => {
            const isCompleted = completedStatusIds.has(status.id);
            const isCurrent = status.id === currentStatusId;
            const isUpcoming = status.order > currentOrder;
            const historyEntry = statusHistory.find((h) => h.status === status.id);

            // Calculate if line segment to next status should be primary
            // Show primary if current status or any previous status is completed
            const previousCompleted =
              index > 0 &&
              CASE_STATUSES.slice(0, index).some((s) => completedStatusIds.has(s.id) || s.id === currentStatusId);
            const shouldShowPrimaryLine = isCompleted || isCurrent || previousCompleted;

            return (
              <div key={status.id} className="relative flex min-w-[140px] flex-col items-center">
                {/* Progress line segment to next status */}
                {index < CASE_STATUSES.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-3 left-[calc(50%+12px)] z-0 h-0.5 w-[calc(140px+16px-24px)]",
                      shouldShowPrimaryLine ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}

                {/* Status icon */}
                <div
                  className={cn(
                    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-3" /> : <Circle className="size-3" />}
                </div>

                {/* Content */}
                <div className="mt-3 flex w-full max-w-[140px] flex-col items-center gap-1 px-1">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-center text-[9px] leading-tight font-medium wrap-break-word hyphens-auto">
                      {status.id}. {status.label}
                    </span>
                    {isCurrent && (
                      <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[8px] whitespace-nowrap">
                        Current
                      </span>
                    )}
                  </div>
                  {historyEntry && (
                    <div className="text-muted-foreground mt-1 space-y-0.5 text-center text-[8px]">
                      <div className="whitespace-nowrap">{historyEntry.dateTime}</div>
                      {historyEntry.description && (
                        <div className="line-clamp-1 max-w-full text-[7px]">{historyEntry.description}</div>
                      )}
                    </div>
                  )}
                  {isUpcoming && !isCurrent && (
                    <div className="text-muted-foreground mt-1 text-[8px] italic">Pending</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
