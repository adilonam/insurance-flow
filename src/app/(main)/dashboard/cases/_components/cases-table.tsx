"use client";

import { Download, Plus } from "lucide-react";
import { useState, useEffect } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { toast } from "sonner";

import { casesColumns } from "./columns.cases";
import { CreateCaseDialog } from "./create-case-dialog";

type CaseData = {
  id: string;
  caseId: string;
  title: string;
  client: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdByUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export function CasesTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [data, setData] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch cases from API
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cases");
      if (!response.ok) {
        throw new Error("Failed to fetch cases");
      }
      const cases = await response.json();
      setData(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast.error("Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [refreshTrigger]);

  // Recreate table instance when data changes
  const table = useDataTableInstance({
    data: data,
    columns: casesColumns,
    getRowId: (row) => row.id.toString(),
  });

  const handleCaseCreated = () => {
    // Refresh the data
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Cases</CardTitle>
        <CardDescription>View and manage all legal cases and their current status.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="size-4" />
              <span className="hidden lg:inline">Create Case</span>
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
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-md border">
              <DataTable table={table} columns={casesColumns} />
            </div>
            <DataTablePagination table={table} />
          </>
        )}
      </CardContent>
      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSuccess={handleCaseCreated} />
    </Card>
  );
}
