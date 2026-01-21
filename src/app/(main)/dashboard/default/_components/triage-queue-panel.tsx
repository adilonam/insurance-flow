"use client";

import { Clock, ArrowRight, AlertTriangle, DollarSign, Activity, ArrowRightSquare, Wallet, Send, Scale, FileCheck } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

// Status configuration
const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; badgeColor: string }> = {
  PENDING_TRIAGE: { label: "Pending Triage", icon: Clock, badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
  PENDING_FINANCIAL: { label: "Pending Financial Assessment", icon: DollarSign, badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
  PENDING_LIVE_CLAIMS: { label: "Pending Live Claims", icon: Activity, badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400" },
  PENDING_OS_DOCS: { label: "Pending OS Docs", icon: ArrowRightSquare, badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
  PENDING_PAYMENT_PACK_REVIEW: { label: "Pending Payment Pack Review", icon: Wallet, badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
  PENDING_SENT_TO_TP: { label: "Pending Sent to TP", icon: Send, badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400" },
  PENDING_SENT_TO_SOLS: { label: "Pending Sent to Sols", icon: Scale, badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
  PENDING_ISSUED: { label: "Pending Issued", icon: FileCheck, badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" },
};

// Calculate time since creation
function getTimeSince(createdAt: Date | string): string {
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
function ClaimCard({ claim, status }: { claim: ClaimWithRelations; status: string }) {
  const timeSince = getTimeSince(claim.createdAt);
  const missingTp = isMissingTpDetails(claim);
  const statusInfo = statusConfig[status] || statusConfig.PENDING_TRIAGE;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Top bar with name, badges, and review button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{claim.clientName}</span>
          <Badge variant="secondary" className={cn(statusInfo.badgeColor)}>
            <StatusIcon className="mr-1 size-3" />
            {statusInfo.label}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Clock className="mr-1 size-3" />
            {timeSince}
          </Badge>
        </div>
        <Button variant="default" size="sm" asChild>
          <Link
            href={
              claim.status === "PENDING_FINANCIAL"
                ? `/preview/financial?id=${claim.id}`
                : claim.status === "PENDING_LIVE_CLAIMS"
                  ? `/preview/live-claims?id=${claim.id}`
                  : `/preview/triage?id=${claim.id}`
            }
          >
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

type ClaimsQueuePanelProps = {
  status?: string;
};

export function ClaimsQueuePanel({ status = "PENDING_TRIAGE" }: ClaimsQueuePanelProps) {
  const [data, setData] = useState<ClaimWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch claims by status
  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/claims");
      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }
      const claims = await response.json();
      // Filter for the specified status
      const filteredClaims = claims.filter((claim: ClaimWithRelations) => claim.status === status);
      setData(filteredClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [status]);

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

  const statusInfo = statusConfig[status] || statusConfig.PENDING_TRIAGE;
  const StatusIcon = statusInfo.icon;
  const statusTitle = statusInfo.label.split(" ").slice(1).join(" ") || "Triage"; // Remove "Pending" prefix

  return (
    <Card className="flex min-h-[400px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("size-5", status === "PENDING_FINANCIAL" ? "text-purple-600" : "text-foreground")} />
          <h3 className="text-lg font-semibold">{statusTitle}</h3>
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
              <StatusIcon className="size-12 text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm font-medium">No claims in {statusTitle} queue</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedData.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} status={status} />
              ))}
            </div>
            {data.length > 10 && <DataTablePagination table={table} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
