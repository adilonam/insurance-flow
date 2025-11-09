import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Claim } from "@/generated/prisma/client";

// Claim type
type ClaimWithRelations = Claim;

type ClaimColumnsProps = {
  onDelete?: (id: string, clientName: string) => void;
};

export const getClaimColumns = (props?: ClaimColumnsProps): ColumnDef<ClaimWithRelations>[] => [
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
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.clientName}</span>,
    enableHiding: false,
  },
  {
    accessorKey: "dateOfAccident",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date of Accident" />,
    cell: ({ row }) => {
      const date = new Date(row.original.dateOfAccident);
      return <span className="text-muted-foreground tabular-nums">{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.original.type;
      const variant = type === "FAULT" ? "destructive" : "default";
      return <Badge variant={variant}>{type}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant="secondary">{status.replace(/_/g, " ")}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "clientMobile",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Mobile" />,
    cell: ({ row }) => <span>{row.original.clientMobile}</span>,
  },
  {
    accessorKey: "clientPostCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Post Code" />,
    cell: ({ row }) => <span>{row.original.clientPostCode}</span>,
  },
  {
    accessorKey: "tpiInsurerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="TPI Insurer" />,
    cell: ({ row }) => <span>{row.original.tpiInsurerName || "-"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return <span className="text-muted-foreground tabular-nums">{date.toLocaleDateString()}</span>;
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
          <Link href={`/dashboard/claims/${row.original.id}/edit`}>
            <Edit className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
        {props?.onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => props.onDelete?.(row.original.id, row.original.clientName)}
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        )}
        <Button variant="ghost" className="text-muted-foreground flex size-8" size="icon">
          <EllipsisVertical />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];
