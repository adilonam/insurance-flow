import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Edit } from "lucide-react";
import Link from "next/link";
import z from "zod";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { getStatusById } from "./case-statuses";
import { mapStatusEnumToId, mapPriorityEnumToDisplay } from "./status-mapper";
import { Prisma } from "@/generated/prisma/client";

// Extended Case type with relations
type CaseWithRelations = Prisma.CaseGetPayload<{
  include: {
    assignedToUser: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    createdByUser: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export const casesColumns: ColumnDef<CaseWithRelations>[] = [
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
    accessorKey: "caseId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Case ID" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.caseId}</span>,
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
      const statusEnum = row.original.status;
      const statusId = mapStatusEnumToId(statusEnum);
      const status = getStatusById(statusId);
      const statusLabel = status ? `${status.id}. ${status.label}` : statusEnum;
      return <Badge variant="secondary">{statusLabel}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priorityEnum = row.original.priority;
      const priority = mapPriorityEnumToDisplay(priorityEnum);
      const variant = priority === "High" ? "destructive" : priority === "Medium" ? "secondary" : "outline";
      return <Badge variant={variant}>{priority}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
    cell: ({ row }) => {
      const assignedUser = row.original.assignedToUser;
      return <span>{assignedUser?.name || assignedUser?.email || "Unassigned"}</span>;
    },
  },
  {
    accessorKey: "createdByUser",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
    cell: ({ row }) => {
      const createdByUser = row.original.createdByUser;
      return <span>{createdByUser?.name || createdByUser?.email || "Unknown"}</span>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => {
      const date = new Date(row.original.updatedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo: string;
      if (diffMins < 1) {
        timeAgo = "just now";
      } else if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        timeAgo = `${diffDays}d ago`;
      } else {
        timeAgo = date.toLocaleDateString();
      }

      return <span className="text-muted-foreground tabular-nums">{timeAgo}</span>;
    },
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
