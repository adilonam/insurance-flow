"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Schema for claim creation
const createClaimSchema = z.object({
  dateOfAccident: z.string().min(1, "Date of accident is required"),
  type: z.enum(["FAULT", "NON_FAULT"], {
    required_error: "Type is required",
  }),
  status: z.enum(
    [
      "PENDING_TRIAGE",
      "ACCEPTED",
      "REJECTED",
      "IN_PROGRESS_SERVICES",
      "IN_PROGRESS_REPAIRS",
      "PENDING_OFFBOARDING",
      "PENDING_OFFBOARDING_NONCOOPERATIVE",
      "PAYMENT_PACK_PREPARATION",
      "AWAITING_FINAL_PAYMENT",
      "CLOSED",
    ],
    {
      required_error: "Status is required",
    },
  ),
  clientName: z.string().min(1, "Client name is required"),
  clientMobile: z.string().min(1, "Client mobile is required"),
  clientDob: z.string().min(1, "Client date of birth is required"),
  clientPostCode: z.string().min(1, "Client post code is required"),
  additionalDriverName: z.string().optional().or(z.literal("")),
  additionalDriverMobile: z.string().optional().or(z.literal("")),
  additionalDriverDob: z.string().optional().or(z.literal("")),
  additionalDriverPostCode: z.string().optional().or(z.literal("")),
  tpiInsurerName: z.string().optional().or(z.literal("")),
  tpiInsurerContact: z.string().optional().or(z.literal("")),
});

type CreateClaimFormValues = z.infer<typeof createClaimSchema>;

export function CreateClaimForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateClaimFormValues>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      dateOfAccident: "",
      type: "NON_FAULT",
      status: "PENDING_TRIAGE",
      clientName: "",
      clientMobile: "",
      clientDob: "",
      clientPostCode: "",
      additionalDriverName: "",
      additionalDriverMobile: "",
      additionalDriverDob: "",
      additionalDriverPostCode: "",
      tpiInsurerName: "",
      tpiInsurerContact: "",
    },
  });

  const onSubmit = async (data: CreateClaimFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/claims">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to claims</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Claim</h1>
          <p className="text-muted-foreground">Add a new claim to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
          <CardDescription>Enter the information for the new claim</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Accident Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Accident Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateOfAccident"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Accident *</FormLabel>
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING_TRIAGE">Pending Triage</SelectItem>
                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="IN_PROGRESS_SERVICES">In Progress - Services</SelectItem>
                            <SelectItem value="IN_PROGRESS_REPAIRS">In Progress - Repairs</SelectItem>
                            <SelectItem value="PENDING_OFFBOARDING">Pending Offboarding</SelectItem>
                            <SelectItem value="PENDING_OFFBOARDING_NONCOOPERATIVE">Pending Offboarding - Non-Cooperative</SelectItem>
                            <SelectItem value="PAYMENT_PACK_PREPARATION">Payment Pack Preparation</SelectItem>
                            <SelectItem value="AWAITING_FINAL_PAYMENT">Awaiting Final Payment</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter client name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Mobile *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
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
                        <FormLabel>Client Date of Birth *</FormLabel>
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
                    name="clientPostCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Post Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter post code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Driver Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Driver Information (Optional)</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="additionalDriverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Driver Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter additional driver name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalDriverMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Driver Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalDriverDob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Additional Driver Date of Birth</FormLabel>
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
                    name="additionalDriverPostCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Driver Post Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter post code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* TPI Insurer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">TPI Insurer Information (Optional)</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tpiInsurerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TPI Insurer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter TPI insurer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tpiInsurerContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TPI Insurer Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/claims">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create Claim
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

