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
  Plus,
  Car,
  MapPin,
  BookOpen,
  Wrench,
  Settings,
  UserPlus,
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
    label: "NAVIGATION",
    items: [
      {
        title: "Internal Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Submit Claim",
        url: "/dashboard/claims/new",
        icon: Plus,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Hire Module",
        url: "/dashboard/coming-soon",
        icon: Car,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Fleet Tracking",
        url: "/dashboard/coming-soon",
        icon: MapPin,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Communications",
        url: "/dashboard/coming-soon",
        icon: Mail,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Legal Knowledge Base",
        url: "/dashboard/coming-soon",
        icon: BookOpen,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
      {
        title: "Partners",
        url: "/dashboard/partners",
        icon: Handshake,
        roles: ["USER", "PARTNER", "ADMIN"],
        subItems: [
          {
            title: "Partner Development",
            url: "/dashboard/partners/new",
            icon: UserPlus,
            roles: ["USER", "PARTNER", "ADMIN"],
          },
          {
            title: "Partner Management",
            url: "/dashboard/partners",
            icon: Building2,
            roles: ["USER", "PARTNER", "ADMIN"],
          },
        ],
      },
      {
        title: "Services",
        url: "/dashboard/service-providers",
        icon: Wrench,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
    ],
  },
  {
    id: 2,
    label: "SYSTEM",
    items: [
      {
        title: "Settings",
        url: "/dashboard/coming-soon",
        icon: Settings,
        comingSoon: true,
        roles: ["USER", "PARTNER", "ADMIN"],
      },
    ],
  },
];
