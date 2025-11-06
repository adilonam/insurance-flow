"use client";

import { Check, Circle } from "lucide-react";
import { CASE_STATUSES, getStatusById } from "../../_components/case-statuses";
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
      <div className="relative space-y-6">
        {CASE_STATUSES.map((status, index) => {
          const isCompleted = completedStatusIds.has(status.id);
          const isCurrent = status.id === currentStatusId;
          const isUpcoming = status.order > currentOrder;
          const historyEntry = statusHistory.find((h) => h.status === status.id);

          return (
            <div key={status.id} className="relative flex gap-4">
              {/* Timeline line */}
              {index < CASE_STATUSES.length - 1 && (
                <div
                  className={cn(
                    "absolute left-3 top-8 h-full w-0.5",
                    isCompleted ? "bg-primary" : "bg-muted"
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
                      : "border-muted bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <Circle className="size-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1 pb-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{status.id}. {status.label}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Current
                    </span>
                  )}
                </div>
                {historyEntry && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>{historyEntry.dateTime}</div>
                    {historyEntry.description && <div>{historyEntry.description}</div>}
                  </div>
                )}
                {isUpcoming && !isCurrent && (
                  <div className="text-sm text-muted-foreground italic">Pending</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

