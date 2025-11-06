"use client";

import { Download } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { casesData } from "./cases.config";
import { casesColumns } from "./columns.cases";

export function CasesTable() {
  const table = useDataTableInstance({
    data: casesData,
    columns: casesColumns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Cases</CardTitle>
        <CardDescription>View and manage all legal cases and their current status.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
            <Button variant="outline" size="sm">
              <Download />
              <span className="hidden lg:inline">Export</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex size-full flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <DataTable table={table} columns={casesColumns} />
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
