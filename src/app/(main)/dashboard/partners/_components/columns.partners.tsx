import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type PartnerColumnsProps = {
  onDelete?: (id: string, name: string) => void;
};

export const getPartnerColumns = (props?: PartnerColumnsProps): ColumnDef<PartnerWithRelations>[] => [
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge variant="secondary">{type}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span>{row.original.email || "-"}</span>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => <span>{row.original.phone || "-"}</span>,
  },
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.address || "-"}</span>,
  },
  {
    accessorKey: "vehicleRecovery",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle Recovery" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.vehicleRecovery?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "vehicleStorage",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle Storage" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.vehicleStorage?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "replacementHire",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Replacement Hire" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.replacementHire?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "vehicleRepairs",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle Repairs" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.vehicleRepairs?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "independentEngineer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Independent Engineer" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.independentEngineer?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "vehicleInspection",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle Inspection" />,
    cell: ({ row }) => (
      <span className="max-w-[150px] truncate">
        {row.original.vehicleInspection?.name || <span className="text-muted-foreground">Not set</span>}
      </span>
    ),
    enableSorting: false,
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
          <Link href={`/dashboard/partners/${row.original.id}/edit`}>
            <Edit className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
        {props?.onDelete && (
          <Button variant="destructive" size="sm" onClick={() => props.onDelete?.(row.original.id, row.original.name)}>
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
