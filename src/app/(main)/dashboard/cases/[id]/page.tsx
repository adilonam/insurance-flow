import { notFound } from "next/navigation";
import { CaseTimeline } from "./_components/case-timeline";
import { CaseFiles } from "./_components/case-files";
import { StatusNavigation } from "./_components/status-navigation";
import { InitialAssessmentDisplay } from "./_components/initial-assessment-display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mapStatusEnumToLabel, mapPriorityEnumToDisplay, getStatusIdFromEnum } from "../_components/status-mapper";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { CaseStatus } from "@/generated/prisma/client";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      initialAssessments: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!caseData) {
    notFound();
  }

  const statusLabel = mapStatusEnumToLabel(caseData.status);
  const statusId = getStatusIdFromEnum(caseData.status);
  const priorityDisplay = mapPriorityEnumToDisplay(caseData.priority);
  const initialAssessment = caseData.initialAssessments[0] || null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cases">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to cases</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.title}</h1>
            <p className="text-muted-foreground">Case ID: {caseData.caseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              caseData.priority === "HIGH" ? "destructive" : caseData.priority === "MEDIUM" ? "secondary" : "outline"
            }
          >
            {priorityDisplay} Priority
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Case Progress</CardTitle>
          <CardDescription>Track the progress of this case through all status stages</CardDescription>
        </CardHeader>
        <CardContent>
          <CaseTimeline currentStatusId={statusId} statusHistory={[]} />
        </CardContent>
      </Card>

      {/* Initial Assessment Display - Show when status is INITIAL_ASSESSMENT */}
      {caseData.status === CaseStatus.INITIAL_ASSESSMENT && (
        <Card>
          <CardHeader>
            <CardTitle>Initial Assessment</CardTitle>
            <CardDescription>Initial assessment information for this case</CardDescription>
          </CardHeader>
          <CardContent>
            {initialAssessment ? (
              <InitialAssessmentDisplay data={initialAssessment} />
            ) : (
              <p className="text-muted-foreground">No initial assessment data available yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Status Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>{statusLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Client</div>
              <p className="mt-1">{caseData.client}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Assigned To</div>
              <p className="mt-1">
                {caseData.assignedToUser?.name || caseData.assignedToUser?.email || "Not assigned"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Created By</div>
              <p className="mt-1">{caseData.createdByUser?.name || caseData.createdByUser?.email || "Unknown"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Created At</div>
              <p className="mt-1">{new Date(caseData.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Last Updated</div>
              <p className="mt-1">{new Date(caseData.updatedAt).toLocaleString()}</p>
            </div>
            <StatusNavigation currentStatusId={statusId} caseId={caseData.id} />
          </CardContent>
        </Card>

        {/* Files */}
        <CaseFiles files={[]} />
      </div>
    </div>
  );
}
