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

import { getPartnerColumns } from "./columns.partners";
import { Prisma } from "@/generated/prisma/client";

// Partner type with relations
type PartnerWithRelations = Prisma.PartnerGetPayload<{
  include: {
    vehicleRecovery: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    vehicleStorage: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    replacementHire: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    vehicleRepairs: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    independentEngineer: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
    vehicleInspection: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
  };
}>;

export function PartnersTable() {
  const [data, setData] = useState<PartnerWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch partners from API
  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/partners");
      if (!response.ok) {
        throw new Error("Failed to fetch partners");
      }
      const partners = await response.json();
      setData(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to load partners");
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (id: string, name: string) => {
    setPartnerToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  // Delete partner
  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;

    try {
      const response = await fetch(`/api/partners/${partnerToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete partner");
      }

      toast.success("Partner deleted successfully");
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete partner");
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [refreshTrigger]);

  // Get columns with delete handler
  const columns = getPartnerColumns({ onDelete: handleDeleteClick });

  // Recreate table instance when data changes
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Partners</CardTitle>
        <CardDescription>View and manage all partners.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/partners/new">
                <Plus className="size-4" />
                <span className="hidden lg:inline">Create Partner</span>
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
            <p className="text-muted-foreground">Loading partners...</p>
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
              This action cannot be undone. This will permanently delete the partner{" "}
              <strong>{partnerToDelete?.name}</strong>.
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
