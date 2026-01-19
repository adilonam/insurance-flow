"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CalendarIcon, Upload, Sparkles, Info, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Schema for claim creation
const createClaimSchema = z.object({
  type: z.enum(["FAULT", "NON_FAULT"], {
    required_error: "Type is required",
  }),
  linkToPartner: z.boolean().default(false),
  partnerId: z.string().optional(),
  clientName: z.string().min(1, "Full name is required"),
  clientDob: z.string().min(1, "Date of birth is required"),
  clientMobile: z.string().min(1, "Mobile phone is required"),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientPostCode: z.string().min(1, "Postcode is required"),
  vehicleRegistration: z.string().min(1, "Vehicle registration is required"),
  isPrivateHireDriver: z.string().optional(),
  dateOfAccident: z.string().min(1, "Date of accident is required"),
  accidentTime: z.string().optional(),
  accidentLocation: z.string().min(1, "Location is required"),
  accidentCircumstances: z.string().min(1, "Circumstances are required"),
  isVehicleDrivable: z.string().min(1, "Please specify if vehicle is drivable"),
  thirdPartyName: z.string().optional().or(z.literal("")),
  thirdPartyVehicleRegistration: z.string().optional().or(z.literal("")),
  thirdPartyContactNumber: z.string().optional().or(z.literal("")),
});

type CreateClaimFormValues = z.infer<typeof createClaimSchema>;

type Partner = {
  id: string;
  name: string;
};

export function CreateClaimForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Partner search states
  const [partnerState, setPartnerState] = useState<{
    open: boolean;
    query: string;
    partners: Partner[];
    selected: Partner | null;
    searching: boolean;
  }>({
    open: false,
    query: "",
    partners: [],
    selected: null,
    searching: false,
  });

  const form = useForm<CreateClaimFormValues>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      type: "NON_FAULT",
      linkToPartner: false,
      partnerId: "",
      clientName: "",
      clientDob: "",
      clientMobile: "",
      clientEmail: "",
      clientPostCode: "",
      vehicleRegistration: "",
      isPrivateHireDriver: "",
      dateOfAccident: "",
      accidentTime: "",
      accidentLocation: "",
      accidentCircumstances: "",
      isVehicleDrivable: "",
      thirdPartyName: "",
      thirdPartyVehicleRegistration: "",
      thirdPartyContactNumber: "",
    },
  });

  const linkToPartner = form.watch("linkToPartner");

  // Search partners
  const searchPartners = useCallback(async (query: string) => {
    setPartnerState((prev) => ({
      ...prev,
      searching: true,
    }));

    try {
      const response = await fetch("/api/partners");
      if (!response.ok) {
        throw new Error("Failed to search partners");
      }
      const allPartners = await response.json();

      // Filter partners by query if provided
      const filteredPartners = query.trim()
        ? allPartners.filter((partner: Partner) => partner.name.toLowerCase().includes(query.toLowerCase()))
        : allPartners;

      setPartnerState((prev) => ({
        ...prev,
        partners: filteredPartners.slice(0, 10), // Limit to 10 results
        searching: false,
      }));
    } catch (error) {
      console.error("Error searching partners:", error);
      setPartnerState((prev) => ({
        ...prev,
        partners: [],
        searching: false,
      }));
    }
  }, []);

  // Handle partner selection
  const handlePartnerSelect = (partner: Partner) => {
    setPartnerState((prev) => ({
      ...prev,
      selected: partner,
      open: false,
    }));
    form.setValue("partnerId", partner.id);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setUploadedFileName(file.name);
      setUploadedFileKey(result.fileKey);
      toast.success(`File "${file.name}" uploaded successfully. It will be associated with the claim when you submit.`);
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

  const onSubmit = async (data: CreateClaimFormValues) => {
    try {
      setIsSubmitting(true);

      // Only include partnerId if linkToPartner is true
      const submitData = {
        ...data,
        partnerId: data.linkToPartner && data.partnerId ? data.partnerId : undefined,
        status: "PENDING_TRIAGE",
        uploadedFileKey: uploadedFileKey || undefined,
      };

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create claim");
      }

      toast.success("Claim created successfully");
      router.push("/dashboard/claims");
      router.refresh();
    } catch (error) {
      console.error("Error creating claim:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center gap-4 border-b bg-background px-6 py-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/claims">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to claims</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submit Direct Internal Claim</h1>
          <p className="text-sm text-muted-foreground">Create a claim directly (not from partner portal)</p>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          {/* AI-Powered Quick Upload Section */}
          <Card className="border-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-5 text-purple-600" />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">AI-Powered Quick Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a spreadsheet (CSV, Excel) with claim data and let AI automatically extract and prefill the
                    form below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="mt-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" />
                        Upload Spreadsheet
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  {uploadedFileName && (
                    <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      ✓ File uploaded: {uploadedFileName}
                    </div>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="size-3" />
                    File will be saved and associated with the claim for later download.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Internal Submission Info */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Info className="size-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Direct Internal Submission: Use this form when receiving claims directly from clients (phone, walk-in,
              etc.) rather than through a partner portal. You can optionally link the claim to a partner for commission
              tracking.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Claim Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Claim Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select claim type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FAULT">Fault</SelectItem>
                            <SelectItem value="NON_FAULT">Non-Fault</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkToPartner"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Link this claim to a partner (optional)</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {linkToPartner && (
                    <FormField
                      control={form.control}
                      name="partnerId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Partner</FormLabel>
                          <Popover
                            open={partnerState.open}
                            onOpenChange={(open) => {
                              setPartnerState((prev) => ({ ...prev, open }));
                              if (open && partnerState.partners.length === 0) {
                                searchPartners("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !partnerState.selected && "text-muted-foreground",
                                  )}
                                  type="button"
                                >
                                  {partnerState.selected ? partnerState.selected.name : "Search partner..."}
                                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search partner..."
                                  value={partnerState.query}
                                  onValueChange={(value) => {
                                    setPartnerState((prev) => ({ ...prev, query: value }));
                                    searchPartners(value);
                                  }}
                                />
                                <CommandList>
                                  {partnerState.searching ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="size-4 animate-spin" />
                                    </div>
                                  ) : partnerState.partners.length === 0 ? (
                                    <CommandEmpty>No partners found.</CommandEmpty>
                                  ) : (
                                    <CommandGroup>
                                      {partnerState.partners.map((partner) => (
                                        <CommandItem
                                          key={partner.id}
                                          value={partner.id}
                                          onSelect={() => handlePartnerSelect(partner)}
                                        >
                                          {partner.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Client Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Full Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientDob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            Date of Birth <span className="text-destructive">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    (() => {
                                      try {
                                        const date = new Date(field.value);
                                        return isNaN(date.getTime()) ? (
                                          <span>dd/mm/yyyy</span>
                                        ) : (
                                          format(date, "dd/MM/yyyy")
                                        );
                                      } catch {
                                        return <span>dd/mm/yyyy</span>;
                                      }
                                    })()
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
                                selected={
                                  field.value
                                    ? (() => {
                                        try {
                                          const date = new Date(field.value);
                                          return isNaN(date.getTime()) ? undefined : date;
                                        } catch {
                                          return undefined;
                                        }
                                      })()
                                    : undefined
                                }
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Mobile Phone <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter mobile number" {...field} />
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
                            <Input type="email" placeholder="Enter email address" {...field} />
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
                          <FormLabel>
                            Postcode <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter postcode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Vehicle Registration <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter vehicle registration" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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

              {/* Accident Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Accident Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dateOfAccident"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Date of Accident <span className="text-destructive">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  (() => {
                                    try {
                                      const date = new Date(field.value);
                                      return isNaN(date.getTime()) ? (
                                        <span>dd/mm/yyyy</span>
                                      ) : (
                                        format(date, "dd/MM/yyyy")
                                      );
                                    } catch {
                                      return <span>dd/mm/yyyy</span>;
                                    }
                                  })()
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
                              selected={
                                field.value
                                  ? (() => {
                                      try {
                                        const date = new Date(field.value);
                                        return isNaN(date.getTime()) ? undefined : date;
                                      } catch {
                                        return undefined;
                                      }
                                    })()
                                  : undefined
                              }
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accidentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" placeholder="--:--" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accidentLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Location <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Street address or intersection" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accidentCircumstances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Circumstances <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of how the accident occurred..."
                            className="min-h-24 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isVehicleDrivable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Is the vehicle drivable/fit to be driven on the road? <span className="text-destructive">*</span>
                        </FormLabel>
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
                </CardContent>
              </Card>

              {/* Third Party Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Third Party Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="thirdPartyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter third party name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyVehicleRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Registration</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vehicle registration" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyContactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions - Fixed at bottom */}
              <div className="flex items-center justify-end gap-4 border-t bg-background pb-6 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/claims">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Submit Claim
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
