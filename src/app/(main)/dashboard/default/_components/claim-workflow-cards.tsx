"use client";

import {
  Clock,
  DollarSign,
  Activity,
  ArrowRightSquare,
  Wallet,
  Send,
  Scale,
  FileCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkflowCard = {
  id: string;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: "highlight" | "border";
  borderColor: string;
  bgColor?: string;
  iconColor?: string;
};

const workflowCardsTemplate: Omit<WorkflowCard, "count">[] = [
  {
    id: "triage",
    title: "Triage",
    icon: Clock,
    variant: "highlight",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500",
    iconColor: "text-white",
  },
  {
    id: "financial",
    title: "Financial",
    icon: DollarSign,
    variant: "border",
    borderColor: "border-purple-400",
    iconColor: "text-purple-600",
  },
  {
    id: "live-claims",
    title: "Live Claims",
    icon: Activity,
    variant: "border",
    borderColor: "border-sky-300",
    iconColor: "text-sky-500",
  },
  {
    id: "os-docs",
    title: "OS Docs",
    icon: ArrowRightSquare,
    variant: "border",
    borderColor: "border-orange-500",
    iconColor: "text-orange-600",
  },
  {
    id: "pp-review",
    title: "PP Review",
    icon: Wallet,
    variant: "border",
    borderColor: "border-green-500",
    iconColor: "text-green-600",
  },
  {
    id: "sent-to-tp",
    title: "Sent to TP",
    icon: Send,
    variant: "border",
    borderColor: "border-sky-300",
    iconColor: "text-sky-500",
  },
  {
    id: "sent-to-sols",
    title: "Sent to Sols",
    icon: Scale,
    variant: "border",
    borderColor: "border-purple-400",
    iconColor: "text-purple-600",
  },
  {
    id: "issued",
    title: "Issued",
    icon: FileCheck,
    variant: "border",
    borderColor: "border-emerald-300",
    iconColor: "text-emerald-500",
  },
];

// Map card IDs to their corresponding claim statuses
const statusMap: Record<string, string> = {
  triage: "PENDING_TRIAGE",
  financial: "PENDING_FINANCIAL",
  "live-claims": "PENDING_LIVE_CLAIMS",
  "os-docs": "PENDING_OS_DOCS",
  "pp-review": "PENDING_PAYMENT_PACK_REVIEW",
  "sent-to-tp": "PENDING_SENT_TO_TP",
  "sent-to-sols": "PENDING_SENT_TO_SOLS",
  issued: "PENDING_ISSUED",
};

type ClaimWorkflowCardsProps = {
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
};

export function ClaimWorkflowCards({ selectedStatus, onStatusChange }: ClaimWorkflowCardsProps) {
  const router = useRouter();
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchClaimCounts = async () => {
      try {
        const response = await fetch("/api/claims");
        if (response.ok) {
          const claims = await response.json();
          const counts: Record<string, number> = {};

          // Count claims by status
          claims.forEach((claim: { status: string }) => {
            counts[claim.status] = (counts[claim.status] || 0) + 1;
          });

          setStatusCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching claim counts:", error);
      }
    };

    fetchClaimCounts();
  }, []);

  const handleCardClick = (cardId: string) => {
    const status = statusMap[cardId];
    if (status) {
      onStatusChange?.(status);
    }
  };

  const workflowCards: WorkflowCard[] = workflowCardsTemplate.map((card) => {
    const status = statusMap[card.id];
    const count = status ? statusCounts[status] || 0 : 0;
    return {
      ...card,
      count,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase text-foreground">CLAIM WORKFLOWS:</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {workflowCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 transition-colors cursor-pointer",
                // Override default bg-card for highlighted cards
                card.variant === "highlight" && "!bg-orange-500 border-2 border-orange-500 text-white",
                card.variant === "border" && card.borderColor && "border bg-white dark:bg-card",
                card.variant === "border" && "hover:bg-gray-50 dark:hover:bg-accent",
                // Highlight selected card
                statusMap[card.id] === selectedStatus && card.variant === "border" && "ring-2 ring-offset-2 ring-purple-500",
              )}
            >
              <Icon className={cn("size-6", card.iconColor || (card.variant === "highlight" ? "text-white" : "text-foreground"))} />
              <span
                className={cn(
                  "text-sm font-medium",
                  card.variant === "highlight" ? "text-white" : "text-foreground",
                )}
              >
                {card.title}
              </span>
              <span
                className={cn(
                  "text-2xl font-bold",
                  card.variant === "highlight" ? "text-white" : "text-foreground",
                )}
              >
                {card.count}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
