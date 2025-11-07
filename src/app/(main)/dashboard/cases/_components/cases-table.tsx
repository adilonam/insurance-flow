"use client";

import { Download, Plus } from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { casesData } from "./cases.config";
import { casesColumns } from "./columns.cases";
import { CreateCaseDialog } from "./create-case-dialog";

export function CasesTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [data, setData] = useState([...casesData]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Recreate table instance when data changes
  const table = useDataTableInstance({
    data: data,
    columns: casesColumns,
    getRowId: (row) => row.id.toString(),
  });

  const handleCaseCreated = () => {
    // Create a completely new array reference from the updated casesData
    // This ensures React detects the change and re-renders the table
    const newData = [...casesData];
    setData(newData);
    // Trigger a refresh to ensure table updates
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
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={casesColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSuccess={handleCaseCreated} />
    </Card>
  );
}
