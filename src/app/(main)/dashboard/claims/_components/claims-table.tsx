"use client";

import { Download, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { toast } from "sonner";

import { getClaimColumns } from "./columns.claims";
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

export function ClaimsTable() {
  const [data, setData] = useState<ClaimWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<{ id: string; clientName: string } | null>(null);

  // Fetch claims from API
  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/claims");
      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }
      const claims = await response.json();
      setData(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast.error("Failed to load claims");
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (id: string, clientName: string) => {
    setClaimToDelete({ id, clientName });
    setDeleteDialogOpen(true);
  };

  // Delete claim
  const handleDeleteConfirm = async () => {
    if (!claimToDelete) return;

    try {
      const response = await fetch(`/api/claims/${claimToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete claim");
      }

      toast.success("Claim deleted successfully");
      setDeleteDialogOpen(false);
      setClaimToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting claim:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete claim");
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [refreshTrigger]);

  // Get columns with delete handler
  const columns = getClaimColumns({ onDelete: handleDeleteClick });

  // Recreate table instance when data changes
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Claims</CardTitle>
        <CardDescription>View and manage all claims.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/claims/new">
                <Plus className="size-4" />
                <span className="hidden lg:inline">Create Claim</span>
              </Link>
            </Button>
            <DataTableViewOptions table={table} />
            <Button variant="outline" size="sm">
              <Download />
              <span className="hidden lg:inline">Export</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent key={refreshTrigger} className="flex size-full flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading claims...</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-md border">
              <DataTable table={table} columns={columns} />
            </div>
            <DataTablePagination table={table} />
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the claim for{" "}
              <strong>{claimToDelete?.clientName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
