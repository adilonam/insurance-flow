"use client";

import Link from "next/link";
import { FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuickAccessHeaderProps = {
  claimId: string;
  currentView: "triage" | "financial";
};

export function QuickAccessHeader({ claimId, currentView }: QuickAccessHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      <span className="text-sm text-muted-foreground">QUICK ACCESS:</span>
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(
          "border-yellow-500",
          currentView === "triage"
            ? "bg-yellow-50 dark:bg-yellow-950/20"
            : "bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
        )}
      >
        <Link href={`/preview/triage?id=${claimId}`}>
          <FileText className="mr-2 size-4" />
          Triage
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className={cn(
          "border-purple-500",
          currentView === "financial"
            ? "bg-purple-50 dark:bg-purple-950/20"
            : "bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950/20",
        )}
      >
        <Link href={`/preview/financial?id=${claimId}`}>
          <DollarSign className="mr-2 size-4" />
          Financial
        </Link>
      </Button>
    </div>
  );
}
