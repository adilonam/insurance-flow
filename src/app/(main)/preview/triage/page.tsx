"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  X,
  Users,
  Shield,
  Clock,
  Brain,
  Mail,
  Plus,
  FileText,
  CalendarIcon,
  Download,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";
import { Prisma } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  };
}>;

// Form schema
const claimFormSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientMobile: z.string().min(1, "Mobile phone is required"),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientDob: z.string().min(1, "Date of birth is required"),
  clientPostCode: z.string().min(1, "Postcode is required"),
  isPrivateHireDriver: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

// Calculate time in triage
function getTimeInTriage(createdAt: Date | string): string {
  const now = new Date();
  const createdAtDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;

  if (isNaN(createdAtDate.getTime())) {
    return "N/A";
  }

  const diffMs = now.getTime() - createdAtDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} minutes`;
  } else if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  }
}

// Calculate progress percentages
function calculateProgress(claim: Claim) {
  let basicInfo = 0;
  let accident = 0;
  let vehicle = 0;
  let images = 0;
  let documents = 0;
  let eligibility = 0;

  // Basic Info progress
  if (claim.clientName) basicInfo += 20;
  if (claim.clientDob) basicInfo += 20;
  if (claim.clientMobile) basicInfo += 20;
  if (claim.clientEmail) basicInfo += 20;
  if (claim.clientPostCode) basicInfo += 20;

  // Accident progress
  if (claim.dateOfAccident) accident += 25;
  if (claim.accidentLocation) accident += 25;
  if (claim.accidentCircumstances) accident += 25;
  if (claim.accidentTime) accident += 25;

  // Vehicle progress
  if (claim.vehicleRegistration) vehicle += 100;

  // Images, Documents, Eligibility - mock for now
  images = 0;
  documents = 0;
  eligibility = 0;

  return { basicInfo, accident, vehicle, images, documents, eligibility };
}

export default function TriagePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split client name into first name and surname for display
  const getClientNameParts = (name: string) => {
    const parts = name.split(" ");
    return {
      firstName: parts[0] || "",
      surname: parts.slice(1).join(" ") || "",
    };
  };

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      clientName: "",
      clientMobile: "",
      clientEmail: "",
      clientDob: "",
      clientPostCode: "",
      isPrivateHireDriver: "",
    },
  });

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

        // Set form values
        form.reset({
          clientName: data.clientName || "",
          clientMobile: data.clientMobile || "",
          clientEmail: data.clientEmail || "",
          clientDob: data.clientDob ? format(new Date(data.clientDob), "yyyy-MM-dd") : "",
          clientPostCode: data.clientPostCode || "",
          isPrivateHireDriver: data.isPrivateHireDriver || "",
        });
      } catch (err) {
        console.error("Error fetching claim:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch claim");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaim();
  }, [claimId, form]);

  const onSubmit = async (data: ClaimFormValues) => {
    if (!claimId) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: data.clientName,
          clientMobile: data.clientMobile,
          clientEmail: data.clientEmail || "",
          clientDob: data.clientDob,
          clientPostCode: data.clientPostCode,
          isPrivateHireDriver: data.isPrivateHireDriver || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save claim");
      }

      const updatedClaim = await response.json();
      setClaim(updatedClaim);
      toast.success("Claim saved successfully");
    } catch (err) {
      console.error("Error saving claim:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save claim");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!claimId || !claim?.uploadedFileKey) {
      toast.error("No file available to download");
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(`/api/claims/${claimId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Use original filename if available, otherwise fallback to key
      a.download = (claim as any).uploadedFileName || claim.uploadedFileKey.split("/").pop() || "claim-file";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      toast.error(err instanceof Error ? err.message : "Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAcceptClaim = async () => {
    if (!claimId) return;

    try {
      setIsAccepting(true);
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING_FINANCIAL",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept claim");
      }

      toast.success("Claim accepted and moved to Financial");
      router.push("/dashboard/default");
      router.refresh();
    } catch (err) {
      console.error("Error accepting claim:", err);
      toast.error(err instanceof Error ? err.message : "Failed to accept claim");
    } finally {
      setIsAccepting(false);
      setShowAcceptDialog(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!claimId) {
      toast.error("Claim ID is required");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error("Invalid file type. Only CSV and Excel files are allowed.");
      return;
    }

    try {
      setIsUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("claimId", claimId);

      // Upload file to S3/MinIO
      const response = await fetch("/api/claims/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const result = await response.json();

      // Refresh claim data to get updated uploadedFileKey
      const claimResponse = await fetch(`/api/claims/${claimId}`);
      if (claimResponse.ok) {
        const updatedClaim = await claimResponse.json();
        setClaim(updatedClaim);
      }

      toast.success(
        claim?.uploadedFileKey
          ? `File "${file.name}" replaced successfully.`
          : `File "${file.name}" uploaded successfully.`,
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
          <Link href="/dashboard/claims">Back to Claims</Link>
        </Button>
      </div>
    );
  }

  const progress = calculateProgress(claim);
  const timeInTriage = getTimeInTriage(claim.createdAt);
  const claimIdShort = claim.id.substring(0, 12);
  const nameParts = getClientNameParts(form.watch("clientName") || claim.clientName);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Access Bar */}
        {claimId && <QuickAccessHeader claimId={claimId} currentView="triage" />}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Triage Assessment</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Claim ID: {claimIdShort}... • {claim.type.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {claim.uploadedFileKey && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Download File
                  </>
                )}
              </Button>
            )}
            <Button type="submit" variant="outline" size="sm" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Progress
                </>
              )}
            </Button>
            <Button type="button" variant="destructive" size="sm">
              <X className="mr-2 size-4" />
              Reject
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowAcceptDialog(true)}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Users className="mr-2 size-4" />
                  Accept Claim
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <Shield className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Liability Status</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {claim.type.replace("_", "-")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <Clock className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Time in Triage</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {timeInTriage}
            </Badge>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <Users className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">Partner</span>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {claim.partner ? claim.partner.name : "No Partner"}
            </Badge>
          </div>
        </div>

        {/* Claim Progress */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Basic Info", progress: progress.basicInfo },
            { label: "Accident", progress: progress.accident },
            { label: "Vehicle", progress: progress.vehicle },
            { label: "Images", progress: progress.images },
            { label: "Documents", progress: progress.documents },
            { label: "Eligibility", progress: progress.eligibility },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <div className="text-sm font-medium">{item.label}</div>
              <div
                className={cn(
                  "mt-2 text-2xl font-bold",
                  item.progress > 0 ? "text-red-600" : "text-muted-foreground",
                )}
              >
                {item.progress}%
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Middle Name <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <Input value="" readOnly className="mt-1" placeholder="Optional" />
                  </div>
                  <FormField
                    control={form.control}
                    name="clientDob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal mt-1",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "dd/MM/yyyy")
                                ) : (
                                  <span>dd/mm/yyyy</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={2100}
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {field.value && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Display: {format(new Date(field.value), "dd/MM/yyyy")}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Phone</FormLabel>
                        <FormControl>
                          <Input {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientPostCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NI Number</label>
                    <Input value="" readOnly className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3-Year Address History */}
            <Card>
              <CardHeader>
                <CardTitle>3-Year Address History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="size-4" />
                  <AlertDescription>
                    Please add your current address below. W&apos;ll ask for previous addresses if you&apos;ve lived there less
                    than 3 years.
                  </AlertDescription>
                </Alert>
                <Button type="button" variant="outline" className="w-full">
                  <Plus className="mr-2 size-4" />
                  Add Current Address
                </Button>
              </CardContent>
            </Card>

            {/* Client Authorization Document */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5" />
                  <CardTitle>Client Authorization Document</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send authorization form to client for electronic signature
                </p>
                <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700">
                  <Mail className="mr-2 size-4" />
                  Send Authorization for E-Signature
                </Button>
                {(!form.watch("clientName") || !form.watch("clientEmail")) && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Client first name, surname, and email are required to send authorization document.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                  <Input value="" readOnly className="mt-1" placeholder="Select employment status..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Do you work in the motor trade? (garage, rental company, vehicle related)
                  </label>
                  <Input value="" readOnly className="mt-1" placeholder="Select..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Have you ever been declared bankrupt, entered into an Individual Voluntary Arrangement (IVA), or
                    are you currently in the process of doing so?
                  </label>
                  <Input value="" readOnly className="mt-1" placeholder="Select..." />
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Driving License Number</label>
                  <Input value="" readOnly className="mt-1" placeholder="e.g., MORGA657054SM9IJ" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Issue Date</label>
                  <div className="relative mt-1">
                    <Input value="" readOnly className="pr-10" placeholder="dd/mm/yyyy" />
                    <CalendarIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Expiry Date</label>
                  <div className="relative mt-1">
                    <Input value="" readOnly className="pr-10" placeholder="dd/mm/yyyy" />
                    <CalendarIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="isPrivateHireDriver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is the driver a Private Hire or Public Hire driver?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Insights & File Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5" />
                  <CardTitle>Uploaded File</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {claim.uploadedFileKey ? (
                  <>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {(claim as any).uploadedFileName || claim.uploadedFileKey.split("/").pop() || "File uploaded"}
                          </p>
                          <p className="text-xs text-muted-foreground">File is available</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 size-4" />
                            Download
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFileUpload}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 size-4" />
                            Replace
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      No file uploaded yet. Upload a CSV or Excel file to associate it with this claim.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleFileUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 size-4" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </p>
              </CardContent>
            </Card>

            {/* Partner Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="size-5" />
                  <CardTitle>Partner Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {claim.partner ? (
                  <>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{claim.partner.name}</p>
                      </div>
                      {claim.partner.type && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Type</p>
                          <p className="text-sm">{claim.partner.type.replace("_", " ")}</p>
                        </div>
                      )}
                      {claim.partner.email && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Email</p>
                          <p className="text-sm">{claim.partner.email}</p>
                        </div>
                      )}
                      {claim.partner.phone && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Phone</p>
                          <p className="text-sm">{claim.partner.phone}</p>
                        </div>
                      )}
                      {claim.partner.address && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Address</p>
                          <p className="text-sm">{claim.partner.address}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No partner linked to this claim.</p>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="size-5" />
                  <CardTitle>AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload accident images to receive AI-powered damage assessment and fraud detection analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Accept Claim Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this claim? This will move it to the Financial stage and it will appear on the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAcceptClaim}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Claim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
