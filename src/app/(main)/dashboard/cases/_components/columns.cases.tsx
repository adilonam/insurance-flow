import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Edit } from "lucide-react";
import Link from "next/link";
import z from "zod";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { getStatusById } from "./case-statuses";
import { caseSchema } from "./schema";

export const casesColumns: ColumnDef<z.infer<typeof caseSchema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Case ID" />,
    cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.id}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    enableHiding: false,
  },
  {
    accessorKey: "client",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => <span>{row.original.client}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const statusId = row.original.status;
      const status = getStatusById(statusId);
      const statusLabel = status ? `${status.id}. ${status.label}` : statusId;
      return <Badge variant="secondary">{statusLabel}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priority = row.original.priority;
      const variant =
        priority === "High" ? "destructive" : priority === "Medium" ? "secondary" : "outline";
      return <Badge variant={variant}>{priority}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
    cell: ({ row }) => <span>{row.original.assignedTo}</span>,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.original.updatedAt}</span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/cases/${row.original.id}`}>
            <Edit className="size-4" />
            <span className="hidden sm:inline">Modify</span>
          </Link>
        </Button>
        <Button variant="ghost" className="text-muted-foreground flex size-8" size="icon">
          <EllipsisVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];

