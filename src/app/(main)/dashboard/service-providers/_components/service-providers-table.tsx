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

import { getServiceProviderColumns } from "./columns.service-providers";
import { ServiceProvider } from "@/generated/prisma/client";

// ServiceProvider type
type ServiceProviderWithRelations = ServiceProvider;

export function ServiceProvidersTable() {
  const [data, setData] = useState<ServiceProviderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceProviderToDelete, setServiceProviderToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch service providers from API
  const fetchServiceProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/service-providers");
      if (!response.ok) {
        throw new Error("Failed to fetch service providers");
      }
      const serviceProviders = await response.json();
      setData(serviceProviders);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      toast.error("Failed to load service providers");
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (id: string, name: string) => {
    setServiceProviderToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  // Delete service provider
  const handleDeleteConfirm = async () => {
    if (!serviceProviderToDelete) return;

    try {
      const response = await fetch(`/api/service-providers/${serviceProviderToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete service provider");
      }

      toast.success("Service provider deleted successfully");
      setDeleteDialogOpen(false);
      setServiceProviderToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting service provider:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete service provider");
    }
  };

  useEffect(() => {
    fetchServiceProviders();
  }, [refreshTrigger]);

  // Get columns with delete handler
  const columns = getServiceProviderColumns({ onDelete: handleDeleteClick });

  // Recreate table instance when data changes
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Service Providers</CardTitle>
        <CardDescription>View and manage all service providers.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/service-providers/new">
                <Plus className="size-4" />
                <span className="hidden lg:inline">Create Service Provider</span>
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
            <p className="text-muted-foreground">Loading service providers...</p>
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
              This action cannot be undone. This will permanently delete the service provider{" "}
              <strong>{serviceProviderToDelete?.name}</strong>.
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
