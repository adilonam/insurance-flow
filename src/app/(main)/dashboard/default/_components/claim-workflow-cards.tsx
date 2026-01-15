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

const workflowCards: WorkflowCard[] = [
  {
    id: "triage",
    title: "Triage",
    count: 0,
    icon: Clock,
    variant: "highlight",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500",
    iconColor: "text-white",
  },
  {
    id: "financial",
    title: "Financial",
    count: 0,
    icon: DollarSign,
    variant: "border",
    borderColor: "border-purple-400",
    iconColor: "text-purple-600",
  },
  {
    id: "live-claims",
    title: "Live Claims",
    count: 9,
    icon: Activity,
    variant: "border",
    borderColor: "border-sky-300",
    iconColor: "text-sky-500",
  },
  {
    id: "os-docs",
    title: "OS Docs",
    count: 0,
    icon: ArrowRightSquare,
    variant: "border",
    borderColor: "border-orange-500",
    iconColor: "text-orange-600",
  },
  {
    id: "pp-review",
    title: "PP Review",
    count: 1,
    icon: Wallet,
    variant: "border",
    borderColor: "border-green-500",
    iconColor: "text-green-600",
  },
  {
    id: "sent-to-tp",
    title: "Sent to TP",
    count: 0,
    icon: Send,
    variant: "border",
    borderColor: "border-sky-300",
    iconColor: "text-sky-500",
  },
  {
    id: "sent-to-sols",
    title: "Sent to Sols",
    count: 2,
    icon: Scale,
    variant: "border",
    borderColor: "border-purple-400",
    iconColor: "text-purple-600",
  },
  {
    id: "issued",
    title: "Issued",
    count: 0,
    icon: FileCheck,
    variant: "border",
    borderColor: "border-emerald-300",
    iconColor: "text-emerald-500",
  },
];

export function ClaimWorkflowCards() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase text-foreground">CLAIM WORKFLOWS:</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {workflowCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 transition-colors",
                // Override default bg-card for highlighted cards
                card.variant === "highlight" && "!bg-orange-500 border-2 border-orange-500 text-white",
                card.variant === "border" && card.borderColor && "border bg-white dark:bg-card",
                card.variant === "border" && "hover:bg-gray-50 dark:hover:bg-accent",
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
