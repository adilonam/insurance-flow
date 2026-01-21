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
  Clock,
  DollarSign,
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  Building2,
  CreditCard,
  FileCheck,
  ShoppingCart,
  Home,
  AlertTriangle,
  RotateCcw,
  Check,
  Info,
} from "lucide-react";
import { Prisma } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuickAccessHeader } from "../_components/quick-access-header";
import { BankAccountsForm } from "./_components/bank-accounts-form";
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
const financialFormSchema = z.object({
  hasIsagiCheck: z.string().optional(),
  creditCardInterest: z.string().optional(),
  financialAssessment: z.string().optional(),
  assessmentNotes: z.string().optional(),
});

type FinancialFormValues = z.infer<typeof financialFormSchema>;

// Calculate time since
function getTimeSince(createdAt: Date | string): string {
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
    return `${diffHours.toFixed(1)} hours`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day(s)`;
  }
}

export default function FinancialPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showBankAccountsForm, setShowBankAccountsForm] = useState(false);
  const [bankAccountsCount, setBankAccountsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isagiReportUploaded, setIsagiReportUploaded] = useState(false);
  const [reportDate, setReportDate] = useState<string | null>(null);

  const form = useForm<FinancialFormValues>({
    resolver: zodResolver(financialFormSchema),
    defaultValues: {
      hasIsagiCheck: "",
      creditCardInterest: "",
      financialAssessment: "Pending",
      assessmentNotes: "",
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
      } catch (err) {
        console.error("Error fetching claim:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch claim");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchBankAccountsCount = async () => {
      try {
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.bankAccounts) {
            setBankAccountsCount(data.bankAccounts.length);
          } else {
            setBankAccountsCount(0);
          }
        }
      } catch (error) {
        console.error("Error fetching bank accounts count:", error);
      }
    };

    fetchClaim();
    fetchBankAccountsCount();
  }, [claimId]);

  const onSubmit = async (data: FinancialFormValues) => {
    if (!claimId) return;

    try {
      setIsSaving(true);
      // TODO: Update claim with financial assessment data
      toast.success("Financial assessment saved successfully");
    } catch (err) {
      console.error("Error saving financial assessment:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save financial assessment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      // TODO: Upload Isagi report
      setIsagiReportUploaded(true);
      setReportDate(format(new Date(), "dd MMMM yyyy"));
      toast.success("Isagi report uploaded and processed successfully");
    } catch (error) {
      console.error("Error uploading report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload report");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApprove = async () => {
    if (!claimId) return;

    try {
      setIsApproving(true);
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING_LIVE_CLAIMS",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve claim");
      }

      toast.success("Claim approved and moved to Live Queue");
      router.push("/dashboard/default");
      router.refresh();
    } catch (err) {
      console.error("Error approving claim:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve claim");
    } finally {
      setIsApproving(false);
      setShowApproveDialog(false);
    }
  };

  const handleSendBackToTriage = async () => {
    if (!claimId) return;

    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING_TRIAGE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send back to triage");
      }

      toast.success("Claim sent back to Triage");
      router.push("/dashboard/default");
      router.refresh();
    } catch (err) {
      console.error("Error sending back to triage:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send back to triage");
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
          <Link href="/dashboard/default">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const claimIdShort = claim.id.substring(0, 12);
  const timeInTriage = getTimeSince(claim.createdAt);
  // Calculate time in financial (mock for now - would need to track when status changed)
  const timeInFinancial = "34.6 hours";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Quick Access Bar */}
        {claimId && claim && <QuickAccessHeader claimId={claimId} claimStatus={claim.status} currentView="financial" />}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Client Financial Assessment</h1>
              <p className="mt-1 text-sm text-muted-foreground">Assess financial standing for {claim.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Pending Financial Review
            </Badge>
          </div>
        </div>

        {/* Information Banner */}
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="size-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Financial Assessment: Upload the Isagi soft search report - financial data will be automatically extracted
            and parsed into the sections below.
          </AlertDescription>
        </Alert>

        {/* Time Tracking Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time in Triage</p>
                <p className="text-lg font-semibold">{timeInTriage}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time in Financial</p>
                <p className="text-lg font-semibold">{timeInFinancial}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Claim Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Claim Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Claim Type:</span>
                  <span className="ml-2 font-medium">{claim.type.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Client Name:</span>
                  <span className="ml-2 font-medium">{claim.clientName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="ml-2 font-medium">
                    {claim.clientDob ? format(new Date(claim.clientDob), "dd MMM yyyy") : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">NI Number:</span>
                  <span className="ml-2 font-medium">N/A</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Postcode:</span>
                  <span className="ml-2 font-medium">{claim.clientPostCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Employment:</span>
                  <span className="ml-2 font-medium">N/A</span>
                </div>
              </CardContent>
            </Card>

            {/* Bankruptcy & IVA */}
            <Card>
              <CardHeader>
                <CardTitle>Bankruptcy & IVA</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Not Provided
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Isagi Soft Search */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5" />
                  <CardTitle>Isagi Soft Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasIsagiCheck"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Has Isagi Check Been Conducted?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Upload Isagi Report (Auto-Extract Financial Data)</FormLabel>
                  {!isagiReportUploaded ? (
                    <div
                      onClick={handleFileUpload}
                      className="mt-2 flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50"
                    >
                      <Upload className="size-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload Isagi report</p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                  ) : (
                    <div className="mt-2 space-y-4 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="size-5 text-green-600" />
                          <p className="font-medium text-green-600">Report Uploaded & Processed</p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm">
                            <Download className="mr-2 size-4" />
                            View Report
                          </Button>
                          <Button type="button" variant="destructive" size="sm">
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          11 Bank Accounts
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          8 Credit Cards
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          1 Loans
                        </Badge>
                      </div>
                      {reportDate && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileText className="size-4" />
                          Report Date: {reportDate}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manage Bank Accounts */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowBankAccountsForm(!showBankAccountsForm)}
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="size-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Manage Bank Accounts</p>
                      <p className="text-sm text-muted-foreground">
                        Click to view and manage current accounts and bank statements
                      </p>
                      <Badge className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {bankAccountsCount} {bankAccountsCount === 1 ? "item" : "items"} extracted
                      </Badge>
                    </div>
                  </div>
                  <ArrowLeft
                    className={cn(
                      "size-5 rotate-180 text-muted-foreground transition-transform",
                      showBankAccountsForm && "rotate-90",
                    )}
                  />
                </div>
                {showBankAccountsForm && claimId && claim && (
                  <div className="mt-6">
                    <BankAccountsForm
                      claimId={claimId}
                      accidentDate={new Date(claim.dateOfAccident)}
                      onAccountsChange={(count) => setBankAccountsCount(count)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manage Credit/Store Cards */}
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <CreditCard className="size-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Credit/Store Cards</p>
                    <p className="text-sm text-muted-foreground">
                      Click to view and manage credit and store cards
                    </p>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      8 items extracted
                    </Badge>
                  </div>
                </div>
                <ArrowLeft className="size-5 rotate-180 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Manage Unsecured Loans */}
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <FileCheck className="size-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Unsecured Loans</p>
                    <p className="text-sm text-muted-foreground">Click to view and manage unsecured loans</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      1 item extracted
                    </Badge>
                  </div>
                </div>
                <ArrowLeft className="size-5 rotate-180 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Manage Hire Purchase Agreements */}
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="size-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Hire Purchase Agreements</p>
                    <p className="text-sm text-muted-foreground">
                      Click to view and manage hire purchase agreements
                    </p>
                  </div>
                </div>
                <ArrowLeft className="size-5 rotate-180 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Manage Mortgages */}
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Home className="size-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Mortgages</p>
                    <p className="text-sm text-muted-foreground">Click to view and manage mortgages</p>
                  </div>
                </div>
                <ArrowLeft className="size-5 rotate-180 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Credit Card Interest */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5" />
                  <CardTitle>Credit Card Interest</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="creditCardInterest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Does the client pay any interest on their credit cards?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Impecuniosity Rating */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  <CardTitle>Impecuniosity Rating</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="financialAssessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Assessment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Pending"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assessmentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the financial assessment..."
                          className="min-h-24 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={handleSendBackToTriage} className="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20">
            <RotateCcw className="mr-2 size-4" />
            Send Back to Triage
          </Button>
          <Button type="button" variant="destructive">
            <X className="mr-2 size-4" />
            Reject Claim
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowApproveDialog(true)}
          >
            <Check className="mr-2 size-4" />
            Approve & Move to Live Queue
          </Button>
        </div>
      </form>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Move to Live Queue</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this claim and move it to the Live Queue? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isApproving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve & Move to Live Queue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Form>
  );
}
