"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimStatus } from "@/generated/prisma/client";
import { Loader2 } from "lucide-react";

type ClaimStats = {
  statusCounts: Record<ClaimStatus, number>;
  total: number;
};

export function ClaimStats() {
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/claims/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching claim stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statusLabels: Record<ClaimStatus, string> = {
    PENDING_TRIAGE: "Pending Triage",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    IN_PROGRESS_SERVICES: "In Progress (Services)",
    IN_PROGRESS_REPAIRS: "In Progress (Repairs)",
    PENDING_OFFBOARDING: "Pending Offboarding",
    PENDING_OFFBOARDING_NONCOOPERATIVE: "Pending Offboarding (Non-Cooperative)",
    PAYMENT_PACK_PREPARATION: "Payment Pack Preparation",
    AWAITING_FINAL_PAYMENT: "Awaiting Final Payment",
    CLOSED: "Closed",
  };

  const statusColors: Record<ClaimStatus, string> = {
    PENDING_TRIAGE: "bg-yellow-500",
    ACCEPTED: "bg-green-500",
    REJECTED: "bg-red-500",
    IN_PROGRESS_SERVICES: "bg-blue-500",
    IN_PROGRESS_REPAIRS: "bg-blue-600",
    PENDING_OFFBOARDING: "bg-orange-500",
    PENDING_OFFBOARDING_NONCOOPERATIVE: "bg-orange-600",
    PAYMENT_PACK_PREPARATION: "bg-purple-500",
    AWAITING_FINAL_PAYMENT: "bg-indigo-500",
    CLOSED: "bg-gray-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Total Card */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Claims</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-primary/10 rounded-full p-3">
                <div className="bg-primary h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>

          {/* Status Cards */}
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{statusLabels[status as ClaimStatus]}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <div className="bg-primary/10 rounded-full p-3">
                  <div className={`h-6 w-6 rounded-full ${statusColors[status as ClaimStatus]}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
