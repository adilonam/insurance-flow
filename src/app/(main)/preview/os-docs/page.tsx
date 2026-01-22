"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileText,
  Shield,
  Car,
  FileCheck,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Download,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Prisma } from "@/generated/prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type OffboardingDocument = {
  id: string;
  documentType: string;
  fileKey: string | null;
  fileName: string | null;
  uploadedAt: Date | null;
  isExcluded: boolean;
  excludedAt: Date | null;
};

type OffboardingStep = {
  id: string;
  documents: OffboardingDocument[];
};

// Document type definitions - All shown in Claimant tab
const DOCUMENT_TYPES = {
  CLAIMANT: [
    { id: "driving_license_front", label: "Driving License Front", required: true },
    { id: "driving_license_back", label: "Driving License Back", required: true },
  ],
  VEHICLE: [
    { id: "logbook_v5c", label: "Logbook (V5C)", required: true },
    { id: "private_hire_driver_license", label: "Private Hire Driver License", required: true },
    { id: "private_hire_vehicle_license", label: "Private Hire Vehicle License", required: true },
    { id: "insurance_certificate", label: "Insurance Certificate", required: true },
    { id: "mot_certificate", label: "MOT Certificate", required: true },
  ],
  HIRE_VEHICLE: [
    { id: "hire_vehicle_logbook", label: "Hire Vehicle Logbook", required: true },
    { id: "hire_vehicle_insurance_certificate", label: "Hire Vehicle Insurance Certificate", required: true },
    { id: "hire_vehicle_mot_certificate", label: "Hire Vehicle MOT Certificate", required: true },
  ],
  TL_REPAIRS: [
    { id: "repair_invoice", label: "Repair Invoice", required: true },
    { id: "new_proof_of_purchase_tl", label: "New Proof of Purchase (TL)", required: false },
    { id: "new_keepers_slip_tl", label: "New Keepers Slip (TL)", required: false },
    { id: "new_logbook_tl", label: "New Logbook (TL)", required: false },
  ],
  OUTLAYS: {
    HIRE: [
      { id: "hire_invoice", label: "Hire Invoice", required: true },
    ],
    RECOVERY_STORAGE: [
      { id: "recovery_storage_invoice", label: "Recovery & Storage Invoice", required: true },
    ],
    DISBURSEMENTS: [
      { id: "engineers_report_fee", label: "Engineers Report Fee", required: true },
      { id: "query_fee", label: "Query Fee", required: true },
      { id: "expert_report_fee", label: "Expert Report Fee", required: true },
      { id: "miscellaneous", label: "Miscellaneous", required: false },
    ],
  },
  AUTHORIZATION: [
    { id: "authorization_form", label: "Authorization Form", required: true },
  ],
};

// Calculate total documents
const TOTAL_DOCUMENTS = 
  DOCUMENT_TYPES.CLAIMANT.length + 
  DOCUMENT_TYPES.VEHICLE.length + 
  DOCUMENT_TYPES.HIRE_VEHICLE.length + 
  DOCUMENT_TYPES.TL_REPAIRS.length + 
  DOCUMENT_TYPES.OUTLAYS.HIRE.length +
  DOCUMENT_TYPES.OUTLAYS.RECOVERY_STORAGE.length +
  DOCUMENT_TYPES.OUTLAYS.DISBURSEMENTS.length +
  DOCUMENT_TYPES.AUTHORIZATION.length;

export default function OsDocsPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [offboardingStep, setOffboardingStep] = useState<OffboardingStep | null>(null);
  const [financialStep, setFinancialStep] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("claimant");
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!claimId) {
      setError("Claim ID is required");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [claimResponse, stepResponse, financialResponse] = await Promise.all([
          fetch(`/api/claims/${claimId}`),
          fetch(`/api/claims/${claimId}/offboarding-step`),
          fetch(`/api/claims/${claimId}/financial-step`),
        ]);

        if (!claimResponse.ok) {
          throw new Error("Failed to fetch claim");
        }
        const claimData = await claimResponse.json();
        setClaim(claimData);

        if (stepResponse.ok) {
          const stepData = await stepResponse.json();
          setOffboardingStep(stepData);
        }

        if (financialResponse.ok) {
          const financialData = await financialResponse.json();
          setFinancialStep(financialData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [claimId]);

  const handleFileSelect = (docType: string) => {
    setSelectedDocType(docType);
    setShowUploadModal(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType || !claimId) return;

    setUploadingFile(file);
    setUploadingDocType(selectedDocType);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", selectedDocType);

      const response = await fetch(`/api/claims/${claimId}/offboarding-step/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      
      // Refresh offboarding step data
      const stepResponse = await fetch(`/api/claims/${claimId}/offboarding-step`);
      if (stepResponse.ok) {
        const stepData = await stepResponse.json();
        setOffboardingStep(stepData);
      }

      toast.success("Document uploaded successfully");
      setShowUploadModal(false);
      setSelectedDocType(null);
      setUploadingFile(null);
    } catch (err) {
      console.error("Error uploading document:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploadingDocType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExcludeDocument = async (docType: string) => {
    if (!claimId) return;

    try {
      const response = await fetch(`/api/claims/${claimId}/offboarding-step/documents`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType: docType,
          isExcluded: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to exclude document");
      }

      // Refresh offboarding step data
      const stepResponse = await fetch(`/api/claims/${claimId}/offboarding-step`);
      if (stepResponse.ok) {
        const stepData = await stepResponse.json();
        setOffboardingStep(stepData);
      }

      toast.success("Document excluded");
    } catch (err) {
      console.error("Error excluding document:", err);
      toast.error(err instanceof Error ? err.message : "Failed to exclude document");
    }
  };

  const handleDownloadDocument = async (offboardingDoc: OffboardingDocument) => {
    if (!claimId || !offboardingDoc.fileKey) return;

    try {
      const response = await fetch(`/api/claims/${claimId}/offboarding-step/documents/download?fileKey=${offboardingDoc.fileKey}`);
      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = offboardingDoc.fileName || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading document:", err);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!claimId) return;

    try {
      const response = await fetch(`/api/claims/${claimId}/offboarding-step/documents`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Refresh offboarding step data
      const stepResponse = await fetch(`/api/claims/${claimId}/offboarding-step`);
      if (stepResponse.ok) {
        const stepData = await stepResponse.json();
        setOffboardingStep(stepData);
      }

      toast.success("Document deleted");
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleCompleteOffboarding = async () => {
    if (!claimId) return;

    try {
      setIsCompleting(true);
      const response = await fetch(`/api/claims/${claimId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING_PAYMENT_PACK_REVIEW",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete offboarding");
      }

      toast.success("Offboarding completed");
      setShowCompleteDialog(false);
      router.push("/dashboard/default");
      router.refresh();
    } catch (err) {
      console.error("Error completing offboarding:", err);
      toast.error(err instanceof Error ? err.message : "Failed to complete offboarding");
    } finally {
      setIsCompleting(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!offboardingStep) return { uploaded: 0, excluded: 0, total: TOTAL_DOCUMENTS, percentage: 0 };

    const uploaded = offboardingStep.documents.filter((doc) => doc.fileKey && !doc.isExcluded).length;
    const excluded = offboardingStep.documents.filter((doc) => doc.isExcluded).length;
    const percentage = Math.round(((uploaded + excluded) / TOTAL_DOCUMENTS) * 100);

    return { uploaded, excluded, total: TOTAL_DOCUMENTS, percentage };
  };

  const getDocument = (docType: string): OffboardingDocument | undefined => {
    return offboardingStep?.documents.find((doc) => doc.documentType === docType);
  };

  const isDocumentUploaded = (docType: string): boolean => {
    const doc = getDocument(docType);
    return doc ? !!doc.fileKey && !doc.isExcluded : false;
  };

  const isDocumentExcluded = (docType: string): boolean => {
    const doc = getDocument(docType);
    return doc ? doc.isExcluded : false;
  };

  const completion = calculateCompletion();
  const caseRef = claim?.id ? claim.id.substring(0, 8).toUpperCase() : "N/A";
  const remainingDocs = completion.total - completion.uploaded - completion.excluded;

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
      <QuickAccessHeader claimId={claim.id} claimStatus={claim.status} currentView="os-docs" />

      <Card className="flex min-h-[400px] flex-col gap-6 rounded-xl border py-6 shadow-sm">
        <div className="px-6 flex flex-1 flex-col gap-4 pt-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{claim.clientName}</h1>
                <p className="text-muted-foreground mt-1">Case Ref: {caseRef}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">Completion {completion.percentage}%</p>
                <p className="text-xs text-muted-foreground">
                  {completion.uploaded} uploaded • {completion.excluded} excluded
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowCompleteDialog(true)}
                disabled={remainingDocs > 0}
              >
                Complete Offboarding
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>

          {/* Banner */}
          {remainingDocs > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/20 dark:border-blue-900">
              <p className="text-sm text-blue-900 dark:text-blue-400">
                {remainingDocs} document{remainingDocs !== 1 ? "s" : ""} remaining - Upload or exclude all required documents to complete offboarding.
              </p>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="claimant">Claimant</TabsTrigger>
              <TabsTrigger value="vehicle">Hire Vehicle</TabsTrigger>
              <TabsTrigger value="tl-repairs">TL/Repairs</TabsTrigger>
              <TabsTrigger value="outlays">Outlay(s)</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            {/* Claimant Tab - Show all documents here */}
            <TabsContent value="claimant" className="space-y-6 mt-6">
              {/* Claimant Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="size-5" />
                    Claimant Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.CLAIMANT.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="size-5" />
                    Vehicle Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.VEHICLE.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Authorization Form Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="size-5" />
                    Authorization Form
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {DOCUMENT_TYPES.AUTHORIZATION.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hire Vehicle Tab */}
            <TabsContent value="vehicle" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="size-5" />
                    Hire Vehicle Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.HIRE_VEHICLE.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TL/Repairs Tab */}
            <TabsContent value="tl-repairs" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Loss / Repairs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Information Box */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/20 dark:border-blue-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                          Upload the appropriate documents based on the claim scenario:
                        </p>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                          <li>Repairable: Repair Invoice</li>
                          <li>Total Loss: New Proof of Purchase / New Keepers Slip / New Logbook</li>
                          <li>Total Loss (Claimant Chose to Repair): Repair Invoice for Damaged Vehicle</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Document Upload Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.TL_REPAIRS.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outlay(s) Tab */}
            <TabsContent value="outlays" className="space-y-6 mt-6">
              {/* Hire Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Hire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {DOCUMENT_TYPES.OUTLAYS.HIRE.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recovery & Storage Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Recovery & Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {DOCUMENT_TYPES.OUTLAYS.RECOVERY_STORAGE.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Disbursements Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Disbursements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DOCUMENT_TYPES.OUTLAYS.DISBURSEMENTS.map((docType) => {
                      const doc = getDocument(docType.id);
                      const isUploaded = isDocumentUploaded(docType.id);
                      const isExcluded = isDocumentExcluded(docType.id);

                      return (
                        <Card key={docType.id} className={cn("border-2", isUploaded && "border-green-200", isExcluded && "border-gray-200")}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{docType.label}</p>
                                {docType.required && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {isUploaded && <Upload className="size-5 text-green-600" />}
                            </div>
                            {isUploaded && doc ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{doc.fileName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : isExcluded ? (
                              <div className="text-sm text-muted-foreground">Document excluded</div>
                            ) : (
                              <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleFileSelect(docType.id)}
                              >
                                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              </div>
                            )}
                            {!isUploaded && !isExcluded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-orange-600 hover:text-orange-700"
                                onClick={() => handleExcludeDocument(docType.id)}
                              >
                                <X className="mr-2 size-4" />
                                Exclude Document
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-6 mt-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="size-5" />
                      Financial Summary
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      £0.00
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="size-24 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No outlays recorded for this claim</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Assessment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Assessment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Impecuniosity Rating</p>
                      <p className="text-2xl font-semibold">
                        {financialStep?.financialAssessment || "PENDING"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Isagi Result</p>
                      <p className="text-2xl font-semibold">PENDING</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Modal */}
      <Dialog open={showUploadModal && !!uploadingDocType} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              {uploadingFile ? `Uploading ${uploadingFile.name}...` : "Select a file to upload"}
            </DialogDescription>
          </DialogHeader>
          {uploadingDocType && (
            <div className="py-4">
              {uploadingFile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click the file input to select a document.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={!!uploadingDocType}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Offboarding Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Offboarding</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete offboarding? This will move the claim to Payment Pack Review. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)} disabled={isCompleting}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleCompleteOffboarding}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Offboarding"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
