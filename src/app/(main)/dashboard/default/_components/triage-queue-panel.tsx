"use client";

import { Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TriageQueuePanel() {
  return (
    <Card className="flex min-h-[400px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-foreground" />
          <h3 className="text-lg font-semibold">Triage</h3>
        </div>
        <span className="text-muted-foreground text-sm">0 claim(s)</span>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950/20">
            <FileText className="size-12 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm font-medium">No claims in Triage queue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
