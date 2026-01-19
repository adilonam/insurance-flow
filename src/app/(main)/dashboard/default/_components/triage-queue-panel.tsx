"use client";

import { Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { ColumnDef } from "@tanstack/react-table";
import { Prisma } from "@/generated/prisma/client";

// Claim type with relations
type ClaimWithRelations = Prisma.ClaimGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    partner: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
  };
}>;

// Calculate time in triage
function getTimeInTriage(createdAt: Date | string): string {
  const now = new Date();
  const createdAtDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  
  // Validate date
  if (isNaN(createdAtDate.getTime())) {
    return "N/A";
  }
  
  const diffMs = now.getTime() - createdAtDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} minutes`;
  } else if (diffHours < 24) {
    return `${diffHours.toFixed(1)} hours`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day(s)`;
  }
}

// Check if third party details are missing
function isMissingTpDetails(claim: ClaimWithRelations): boolean {
  return !claim.thirdPartyName || !claim.thirdPartyVehicleRegistration || !claim.thirdPartyContactNumber;
}

// Render a single claim card
function ClaimCard({ claim }: { claim: ClaimWithRelations }) {
  const timeInTriage = getTimeInTriage(claim.createdAt);
  const missingTp = isMissingTpDetails(claim);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Top bar with name, badges, and review button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{claim.clientName}</span>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="mr-1 size-3" />
            Pending Triage
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Clock className="mr-1 size-3" />
            {timeInTriage}
          </Badge>
        </div>
        <Button variant="default" size="sm" asChild>
          <Link href={`/dashboard/claims/${claim.id}/edit`}>
            Review
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      {/* Alert badges */}
      <div className="flex flex-wrap items-center gap-2">
        {missingTp && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            Missing TP Details
          </Badge>
        )}
        <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
          {claim.type.replace("_", " ")}
        </Badge>
      </div>

      {/* Claim details */}
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Case Ref:</span>
          <span className="ml-2">N/A</span>
        </div>
        <div>
          <span className="text-muted-foreground">Vehicle:</span>
          <span className="ml-2 font-medium">{claim.vehicleRegistration || "N/A"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Accident Date:</span>
          <span className="ml-2">{format(new Date(claim.dateOfAccident), "dd/MM/yyyy")}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Submitted:</span>
          <span className="ml-2">{format(new Date(claim.createdAt), "dd/MM/yyyy")}</span>
        </div>
      </div>
    </div>
  );
}

export function TriageQueuePanel() {
  const [data, setData] = useState<ClaimWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch triage claims (status = PENDING_TRIAGE)
  const fetchTriageClaims = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/claims");
      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }
      const claims = await response.json();
      // Filter for PENDING_TRIAGE status
      const triageClaims = claims.filter((claim: ClaimWithRelations) => claim.status === "PENDING_TRIAGE");
      setData(triageClaims);
    } catch (error) {
      console.error("Error fetching triage claims:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageClaims();
  }, []);

  // Create table instance for pagination
  const columns: ColumnDef<ClaimWithRelations>[] = [
    {
      id: "claimant",
      accessorFn: (row) => row.clientName,
    },
  ];
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    getRowId: (row) => row.id.toString(),
    defaultPageSize: 10,
  });

  // Get paginated data
  const paginatedData = table.getRowModel().rows.map((row) => row.original);

  return (
    <Card className="flex min-h-[400px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-foreground" />
          <h3 className="text-lg font-semibold">Triage</h3>
        </div>
        <span className="text-muted-foreground text-sm">
          {data.length} claim{data.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-6">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Loading claims...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-950/20">
              <Clock className="size-12 text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm font-medium">No claims in Triage queue</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedData.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
            {data.length > 10 && <DataTablePagination table={table} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
