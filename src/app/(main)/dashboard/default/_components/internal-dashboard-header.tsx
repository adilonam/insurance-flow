"use client";

import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InternalDashboardHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground">Internal Dashboard</h1>
        <p className="text-muted-foreground text-sm">Review and assess claims across all stages</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 size-4" />
          Sync All Tasks
        </Button>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all claims..."
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
