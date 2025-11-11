import {
  ShoppingBag,
  Forklift,
  Mail,
  MessageSquare,
  Calendar,
  Kanban,
  ReceiptText,
  Users,
  Lock,
  Fingerprint,
  SquareArrowUpRight,
  LayoutDashboard,
  ChartBar,
  Banknote,
  Gauge,
  GraduationCap,
  Briefcase,
  Building2,
  Handshake,
  FileText,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@/generated/prisma/client";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: Role[]; // Roles that can access this item
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: Role[]; // Roles that can access this item
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "Default",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Cases",
        url: "/dashboard/cases",
        icon: Briefcase,
        roles: ["USER", "ADMIN"],
      },
      {
        title: "Claims",
        url: "/dashboard/claims",
        icon: FileText,
        roles: ["PARTNER", "ADMIN"],
      },
      {
        title: "Triage Claims",
        url: "/dashboard/claims/triage",
        icon: ClipboardList,
        roles: ["ADMIN", "USER"],
      },
      {
        title: "Partner",
        url: "/dashboard/partners",
        icon: Handshake,
        roles: ["ADMIN", "USER"],
      },
      {
        title: "ServiceProvider",
        url: "/dashboard/service-providers",
        icon: Building2,
        roles: ["ADMIN", "USER"],
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        roles: ["ADMIN", "USER"],
      },

      {
        title: "Analytics",
        url: "/dashboard/coming-soon",
        icon: Gauge,
        comingSoon: true,
        roles: ["ADMIN"],
      },
      {
        title: "Logistics",
        url: "/dashboard/coming-soon",
        icon: Forklift,
        comingSoon: true,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Email",
        url: "/dashboard/coming-soon",
        icon: Mail,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Chat",
        url: "/dashboard/coming-soon",
        icon: MessageSquare,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Roles",
        url: "/dashboard/coming-soon",
        icon: Lock,
        comingSoon: true,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: 3,
    label: "Misc",
    items: [
      {
        title: "Others",
        url: "/dashboard/coming-soon",
        icon: SquareArrowUpRight,
        comingSoon: true,
        roles: ["ADMIN"],
      },
    ],
  },
];
