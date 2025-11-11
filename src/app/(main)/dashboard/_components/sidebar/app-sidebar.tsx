"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { Settings, CircleHelp, Search, Database, ClipboardList, File, Command } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { Role } from "@/generated/prisma/client";

import { NavMain } from "./nav-main";

// Filter sidebar items based on user role
function filterSidebarItemsByRole(items: typeof sidebarItems, userRole: Role) {
  return items.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      // If no roles specified, allow all (for backward compatibility)
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      // Check if user role is in allowed roles
      return item.roles.includes(userRole);
    }),
  }));
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";

  // Filter items based on user role
  const filteredItems = filterSidebarItemsByRole(sidebarItems, userRole);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard/default">
                <Command />
                <span className="text-base font-semibold">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
