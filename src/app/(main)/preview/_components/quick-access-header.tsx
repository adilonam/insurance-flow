"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, DollarSign, Activity, ArrowRightSquare, Wallet, Send, Scale, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClaimStatus } from "@/generated/prisma/client";

type QuickAccessHeaderProps = {
  claimId: string;
  claimStatus: ClaimStatus;
  currentView?: string;
};

// Define workflow steps in order
const workflowSteps = [
  {
    status: "PENDING_TRIAGE" as ClaimStatus,
    label: "Triage",
    icon: FileText,
    color: "yellow",
    route: "/preview/triage",
  },
  {
    status: "PENDING_FINANCIAL" as ClaimStatus,
    label: "Financial",
    icon: DollarSign,
    color: "purple",
    route: "/preview/financial",
  },
  {
    status: "PENDING_LIVE_CLAIMS" as ClaimStatus,
    label: "Live Claims",
    icon: Activity,
    color: "sky",
    route: "/preview/live-claims",
  },
  {
    status: "PENDING_OS_DOCS" as ClaimStatus,
    label: "OS Docs",
    icon: ArrowRightSquare,
    color: "orange",
    route: "/preview/os-docs",
  },
  {
    status: "PENDING_PAYMENT_PACK_REVIEW" as ClaimStatus,
    label: "PP Review",
    icon: Wallet,
    color: "green",
    route: "/preview/pp-review",
  },
  {
    status: "PENDING_SENT_TO_TP" as ClaimStatus,
    label: "Sent to TP",
    icon: Send,
    color: "sky",
    route: "/preview/sent-to-tp",
  },
  {
    status: "PENDING_SENT_TO_SOLS" as ClaimStatus,
    label: "Sent to Sols",
    icon: Scale,
    color: "purple",
    route: "/preview/sent-to-sols",
  },
  {
    status: "PENDING_ISSUED" as ClaimStatus,
    label: "Issued",
    icon: FileCheck,
    color: "emerald",
    route: "/preview/issued",
  },
];

// Get the order/index of a status in the workflow
function getStatusOrder(status: ClaimStatus): number {
  return workflowSteps.findIndex((step) => step.status === status);
}

// Get all steps up to and including the current status
function getStepsUpToStatus(status: ClaimStatus) {
  const currentOrder = getStatusOrder(status);
  if (currentOrder === -1) return [];
  return workflowSteps.slice(0, currentOrder + 1);
}

export function QuickAccessHeader({ claimId, claimStatus, currentView }: QuickAccessHeaderProps) {
  const pathname = usePathname();
  const stepsToShow = getStepsUpToStatus(claimStatus);

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap: Record<string, { border: string; bg: string; hover: string }> = {
      yellow: {
        border: "border-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-950/20",
        hover: "hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
      },
      purple: {
        border: "border-purple-500",
        bg: "bg-purple-50 dark:bg-purple-950/20",
        hover: "hover:bg-purple-50 dark:hover:bg-purple-950/20",
      },
      sky: {
        border: "border-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/20",
        hover: "hover:bg-sky-50 dark:hover:bg-sky-950/20",
      },
      orange: {
        border: "border-orange-500",
        bg: "bg-orange-50 dark:bg-orange-950/20",
        hover: "hover:bg-orange-50 dark:hover:bg-orange-950/20",
      },
      green: {
        border: "border-green-500",
        bg: "bg-green-50 dark:bg-green-950/20",
        hover: "hover:bg-green-50 dark:hover:bg-green-950/20",
      },
      emerald: {
        border: "border-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        hover: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
      },
    };

    const colors = colorMap[color] || colorMap.yellow;
    return cn(
      colors.border,
      isActive ? colors.bg : "bg-transparent",
      !isActive && colors.hover,
    );
  };

  return (
    <div className="flex items-center gap-2 border-b pb-3">
      <span className="text-sm text-muted-foreground">QUICK ACCESS:</span>
      {stepsToShow.map((step) => {
        const Icon = step.icon;
        // Check if current pathname matches the step route
        const isActive = pathname?.startsWith(step.route) || currentView === step.route.replace("/preview/", "");
        const href = `${step.route}?id=${claimId}`;

        return (
          <Button
            key={step.status}
            variant="outline"
            size="sm"
            asChild
            className={getColorClasses(step.color, isActive)}
          >
            <Link href={href}>
              <Icon className="mr-2 size-4" />
              {step.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
