"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  UserCircle,
  Car,
  AlertCircle,
} from "lucide-react";
import { Prisma } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAccessHeader } from "../_components/quick-access-header";
import { cn } from "@/lib/utils";

type Claim = Prisma.ClaimGetPayload<{
  include: {
    partner: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        address: true;
        type: true;
      };
    };
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export default function LiveClaimsPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!claimId) {
      setError("Claim ID is required");
      setIsLoading(false);
      return;
    }

    const fetchClaim = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch claim");
        }
        const data = await response.json();
        setClaim(data);
      } catch (err) {
        console.error("Error fetching claim:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch claim");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaim();
  }, [claimId]);

  // Generate case reference from claim ID (first 8 characters)
  const caseRef = claim?.id ? claim.id.substring(0, 8).toUpperCase() : "N/A";

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading claim...</p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Claim not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/default">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <QuickAccessHeader claimId={claim.id} claimStatus={claim.status} currentView="live-claims" />

      <Card className="flex min-h-[400px] flex-col gap-6 rounded-xl border py-6 shadow-sm">
        <div className="px-6 flex flex-1 flex-col gap-4 pt-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Claim Details</h1>
                <p className="text-muted-foreground mt-1">
                  Case Ref: {caseRef} • {claim.clientName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Briefcase className="mr-2 size-4" />
                Assign Handler
              </Button>
              <Button variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
                Start Offboarding
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Active
              </Badge>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Claim Handler</p>
                  <p className="font-semibold">{claim.user?.name || "Unassigned"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Claim Type</p>
                  <p className="font-semibold">{claim.type.replace("_", " ")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Accident Date</p>
                  <p className="font-semibold">{format(new Date(claim.dateOfAccident), "dd MMM yyyy")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="font-semibold">1</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="client-info">Client Info</TabsTrigger>
              <TabsTrigger value="accident">Accident</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Client Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="size-5" />
                      Client Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{claim.clientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{format(new Date(claim.clientDob), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mobile</p>
                        <p className="font-medium">{claim.clientMobile}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{claim.clientEmail || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Postcode</p>
                        <p className="font-medium">{claim.clientPostCode}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="size-5" />
                      Vehicle Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Registration</p>
                        <p className="font-medium">{claim.vehicleRegistration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Make & Model</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insurer</p>
                        <p className="font-medium">N/A</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Insurance Type</p>
                        <p className="font-medium">N/A</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Accident Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="size-5" />
                      Accident Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{format(new Date(claim.dateOfAccident), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{claim.accidentTime || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{claim.accidentLocation}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Circumstances</p>
                        <p className="font-medium">{claim.accidentCircumstances}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Other Tabs - Placeholder */}
            <TabsContent value="workflow" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Workflow information will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Services information will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client-info" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Client information will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accident" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Accident details will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicle" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Vehicle details will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Documents will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
