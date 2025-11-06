import { notFound } from "next/navigation";
import { getCaseById } from "../_components/cases.config";
import { CaseTimeline } from "./_components/case-timeline";
import { CaseFiles } from "./_components/case-files";
import { StatusNavigation } from "./_components/status-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusById } from "../_components/case-statuses";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const caseData = getCaseById(id);

  if (!caseData) {
    notFound();
  }

  const currentStatus = getStatusById(caseData.status);
  const statusLabel = currentStatus ? `${currentStatus.id}. ${currentStatus.label}` : caseData.status;

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
            <p className="text-muted-foreground">Case ID: {caseData.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={caseData.priority === "High" ? "destructive" : caseData.priority === "Medium" ? "secondary" : "outline"}
          >
            {caseData.priority} Priority
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
          <CaseTimeline
            currentStatusId={caseData.status}
            statusHistory={caseData.statusHistory}
          />
        </CardContent>
      </Card>

      {/* Current Status Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>{statusLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <p className="mt-1">{caseData.description || "No description available."}</p>
            </div>
            {caseData.statusDateTime && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date & Time</div>
                <p className="mt-1">{caseData.statusDateTime}</p>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Client</div>
              <p className="mt-1">{caseData.client}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
              <p className="mt-1">{caseData.assignedTo}</p>
            </div>
            <StatusNavigation currentStatusId={caseData.status} caseId={caseData.id} />
          </CardContent>
        </Card>

        {/* Files */}
        <CaseFiles files={caseData.files || []} />
      </div>
    </div>
  );
}

