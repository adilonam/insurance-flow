"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Schema for case creation with InitialAssessment
const createCaseSchema = z.object({
  // Case fields
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client name is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assignedTo: z.string().optional(),
  // Initial Assessment fields
  claimReference: z.string().optional(),
  fullName: z.string().optional(),
  address: z.string().optional(),
  postCode: z.string().optional(),
  dateMovedIn: z.string().optional(),
  dateOfBirth: z.string().optional(),
  niNumber: z.string().optional(),
  dlNumber: z.string().optional(),
  dlIssue: z.string().optional(),
  dlExpiry: z.string().optional(),
  claimantContactNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  accidentLocation: z.string().optional(),
  accidentCircumstances: z.string().optional(),
  dateOfAccident: z.string().optional(),
  timeOfAccident: z.string().optional(),
  livedInCurrentAddress3Years: z.string().optional(),
  address2: z.string().optional(),
  address2Dates: z.string().optional(),
  address3: z.string().optional(),
  address3Dates: z.string().optional(),
  defendantName: z.string().optional(),
  defendantReg: z.string().optional(),
  defendantContactNumber: z.string().optional(),
  defendantMakeModelColor: z.string().optional(),
  claimantVehicleRegistration: z.string().optional(),
  claimantInsurer: z.string().optional(),
  claimantMakeModel: z.string().optional(),
  mainPolicyHolder: z.string().optional(),
  additionalDriver1: z.string().optional(),
  additionalDriver2: z.string().optional(),
  additionalDriver3: z.string().optional(),
  noClaimsBonus: z.string().optional(),
  insuranceType: z.string().optional(),
  dateLicenceObtained: z.string().optional(),
  occupation: z.string().optional(),
  ukResidentFromBirth: z.string().optional(),
  ukResidentSince: z.string().optional(),
  vehicleValidMOTAndTax: z.string().optional(),
  everDeclaredBankrupt: z.string().optional(),
  claimantClaimingInjury: z.string().optional(),
  additionalInformation: z.string().optional(),
  accessToOtherVehicles: z.string().optional(),
  ownTheVehicle: z.string().optional(),
  vehicleOwnerRelationship: z.string().optional(),
  carOnFinance: z.string().optional(),
  workInMotorTrade: z.string().optional(),
  needForPrestigeVehicle: z.string().optional(),
  privateHireLicenceYears: z.string().optional(),
  taxiIncomePercent: z.string().optional(),
  additionalEmployment: z.string().optional(),
  witnessName: z.string().optional(),
  witnessContactNumber: z.string().optional(),
  witnessDetailsObtained: z.string().optional(),
  witnessRelationToClaimant: z.string().optional(),
  witnessAdditionalInformation: z.string().optional(),
  nonStandardDriver: z.boolean().optional(),
  agedBetween25And70: z.boolean().optional(),
  fullUKOrEUDrivingLicense2Years: z.boolean().optional(),
  taxiLicence1Year: z.boolean().optional(),
  ukResident3Years: z.boolean().optional(),
  noMoreThan9PenaltyPoints: z.boolean().optional(),
  notBannedFromDriving5Years: z.boolean().optional(),
  noMoreThan1FaultClaim2Years: z.boolean().optional(),
  noNonSpentCriminalConvictions: z.boolean().optional(),
  noDisabilityOrMedicalCondition: z.boolean().optional(),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

type User = {
  id: string;
  name: string | null;
  email: string;
};

export function CreateCasePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const form = useForm<CreateCaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: "",
      client: "",
      priority: "MEDIUM",
      assignedTo: "",
    },
  });

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setIsSearchingUsers(false);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchOpen && userSearchQuery) {
        searchUsers(userSearchQuery);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery, userSearchOpen, searchUsers]);

  const onSubmit = async (data: CreateCaseFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assignedTo: selectedUser?.id || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create case");
      }

      const newCase = await response.json();

      toast.success("Case created successfully");
      router.push(`/dashboard/cases/${newCase.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create case");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Case</h1>
          <p className="text-muted-foreground">Create a new case with initial assessment information</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Case Information */}
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
              <CardDescription>Basic case details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter case title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Assigned To</FormLabel>
                      <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("w-full justify-between", !selectedUser && "text-muted-foreground")}
                              type="button"
                            >
                              {selectedUser ? selectedUser.email : "Search by email..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search users by email..."
                              value={userSearchQuery}
                              onValueChange={setUserSearchQuery}
                            />
                            <CommandList>
                              {isSearchingUsers ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                <>
                                  <CommandEmpty>No users found.</CommandEmpty>
                                  <CommandGroup>
                                    {users.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        value={user.email}
                                        onSelect={() => {
                                          setSelectedUser(user);
                                          form.setValue("assignedTo", user.id);
                                          setUserSearchOpen(false);
                                          setUserSearchQuery("");
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedUser?.id === user.id ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        <span>{user.email}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedUser && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => {
                            setSelectedUser(null);
                            form.setValue("assignedTo", "");
                          }}
                        >
                          Clear selection
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Initial Assessment Section - Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Initial Assessment - Basic Information</CardTitle>
              <CardDescription>Claim and claimant basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="claimReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter claim reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="postCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter post code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateMovedIn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Moved In</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
                  name="niNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NI Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NI number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="dlNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DL Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter driving licence number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dlIssue"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>DL Issue Date</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
                  name="dlExpiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>DL Expiry Date</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="claimantContactNumber"
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
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="livedInCurrentAddress3Years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lived in Current Address 3 Years</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Address 2</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter previous address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address2Dates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address 2 Dates</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter dates (e.g., Jan 2020 - Dec 2022)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Address 3</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter previous address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address3Dates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address 3 Dates</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter dates (e.g., Jan 2018 - Dec 2019)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Accident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Accident Details</CardTitle>
              <CardDescription>Information about the accident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="accidentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accident Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter accident location" {...field} />
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
                    <FormLabel>Accident Circumstances</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the accident circumstances" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateOfAccident"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Accident</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
                  name="timeOfAccident"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Accident</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Defendant Details */}
          <Card>
            <CardHeader>
              <CardTitle>Defendant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defendantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defendant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter defendant name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defendantReg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defendant Registration</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter registration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defendantContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defendant Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defendantMakeModelColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make, Model & Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter make, model and color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Claimant Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle>Claimant Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="claimantVehicleRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Registration</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter registration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="claimantInsurer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurer</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter insurer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="claimantMakeModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make & Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter make and model" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select insurance type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fully Comp">Fully Comp</SelectItem>
                          <SelectItem value="TPFT">TPFT</SelectItem>
                          <SelectItem value="TP">TP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="mainPolicyHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Policy Holder</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noClaimsBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No Claims Bonus</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="additionalDriver1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Driver 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalDriver2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Driver 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalDriver3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Driver 3</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateLicenceObtained"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Licence Obtained</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ukResidentFromBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UK Resident From Birth</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ukResidentSince"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>UK Resident Since</FormLabel>
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
                                    return isNaN(date.getTime()) ? <span>Pick a date</span> : format(date, "PPP");
                                  } catch {
                                    return <span>Pick a date</span>;
                                  }
                                })()
                              ) : (
                                <span>Pick a date</span>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicleValidMOTAndTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Valid MOT & Tax</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="everDeclaredBankrupt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ever Declared Bankrupt</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="claimantClaimingInjury"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claimant Claiming Injury</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any additional information" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Vehicle & Driver Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Vehicle & Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="accessToOtherVehicles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access to Other Vehicles</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownTheVehicle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Own the Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vehicleOwnerRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Owner Relationship</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter relationship" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="carOnFinance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car on Finance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workInMotorTrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work in Motor Trade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="needForPrestigeVehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Need for Prestige Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Private Hire Driver Information */}
          <Card>
            <CardHeader>
              <CardTitle>Private Hire Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="privateHireLicenceYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Hire Licence Years</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxiIncomePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxi Income Percent</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter percentage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalEmployment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Employment</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter additional employment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Witness Details */}
          <Card>
            <CardHeader>
              <CardTitle>Witness Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="witnessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter witness name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="witnessContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="witnessDetailsObtained"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Details Obtained</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="witnessRelationToClaimant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Relation to Claimant</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter relationship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="witnessAdditionalInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Witness Additional Information</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter additional witness information" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Insurance Eligibility Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Eligibility Questions</CardTitle>
              <CardDescription>Answer the following eligibility questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nonStandardDriver"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Non-Standard Driver</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agedBetween25And70"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aged Between 25 and 70</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullUKOrEUDrivingLicense2Years"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Full UK/EU Driving License (2 Years)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxiLicence1Year"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Taxi Licence (1 Year)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ukResident3Years"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>UK Resident (3 Years)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noMoreThan9PenaltyPoints"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>No More Than 9 Penalty Points</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notBannedFromDriving5Years"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Not Banned From Driving (5 Years)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noMoreThan1FaultClaim2Years"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>No More Than 1 Fault Claim (2 Years)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noNonSpentCriminalConvictions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>No Non-Spent Criminal Convictions</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noDisabilityOrMedicalCondition"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>No Disability or Medical Condition</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/cases">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Case"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
