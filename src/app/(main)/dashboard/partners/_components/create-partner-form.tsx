"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Schema for partner creation
const createPartnerSchema = z.object({
  type: z.enum(["DIRECT", "BROKER", "INSURER", "BODYSHOP", "DEALERSHIP", "FLEET"], {
    required_error: "Type is required",
  }),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  vehicleRecoveryId: z.string().optional(),
  vehicleStorageId: z.string().optional(),
  replacementHireId: z.string().optional(),
  vehicleRepairsId: z.string().optional(),
  independentEngineerId: z.string().optional(),
  vehicleInspectionId: z.string().optional(),
});

type CreatePartnerFormValues = z.infer<typeof createPartnerSchema>;

type ServiceProvider = {
  id: string;
  name: string;
  type: string;
};

export function CreatePartnerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ServiceProvider search states for each field
  const [serviceProviderStates, setServiceProviderStates] = useState<{
    [key: string]: {
      open: boolean;
      query: string;
      providers: ServiceProvider[];
      selected: ServiceProvider | null;
      searching: boolean;
    };
  }>({
    vehicleRecovery: { open: false, query: "", providers: [], selected: null, searching: false },
    vehicleStorage: { open: false, query: "", providers: [], selected: null, searching: false },
    replacementHire: { open: false, query: "", providers: [], selected: null, searching: false },
    vehicleRepairs: { open: false, query: "", providers: [], selected: null, searching: false },
    independentEngineer: { open: false, query: "", providers: [], selected: null, searching: false },
    vehicleInspection: { open: false, query: "", providers: [], selected: null, searching: false },
  });

  const form = useForm<CreatePartnerFormValues>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: {
      type: "DIRECT",
      name: "",
      email: "",
      phone: "",
      address: "",
      vehicleRecoveryId: "",
      vehicleStorageId: "",
      replacementHireId: "",
      vehicleRepairsId: "",
      independentEngineerId: "",
      vehicleInspectionId: "",
    },
  });

  // Search service providers
  const searchServiceProviders = useCallback(async (field: string, query: string) => {
    setServiceProviderStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], searching: true },
    }));

    try {
      const url = query.trim()
        ? `/api/service-providers/search?q=${encodeURIComponent(query.trim())}`
        : `/api/service-providers/search`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to search service providers");
      }
      const data = await response.json();
      setServiceProviderStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], providers: data, searching: false },
      }));
    } catch (error) {
      console.error("Error searching service providers:", error);
      setServiceProviderStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], providers: [], searching: false },
      }));
    }
  }, []);

  // Track debounce timers and previous queries
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const prevQueriesRef = useRef<{ [key: string]: string }>({});

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (field: string, query: string) => {
      // Clear existing timer for this field
      if (debounceTimersRef.current[field]) {
        clearTimeout(debounceTimersRef.current[field]);
      }

      // Update query in state
      setServiceProviderStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], query },
      }));

      // Only search if query actually changed
      const prevQuery = prevQueriesRef.current[field] || "";
      if (query !== prevQuery) {
        prevQueriesRef.current[field] = query;

        // Debounce the search
        debounceTimersRef.current[field] = setTimeout(() => {
          searchServiceProviders(field, query);
        }, 300);
      }
    },
    [searchServiceProviders],
  );

  // Load initial providers when dropdown opens
  const handleOpenChange = (field: string, open: boolean) => {
    setServiceProviderStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], open, query: "" },
    }));

    if (open) {
      // Always load first 10 when opening
      prevQueriesRef.current[field] = "";
      searchServiceProviders(field, "");
    } else {
      // Clear timer when closing
      if (debounceTimersRef.current[field]) {
        clearTimeout(debounceTimersRef.current[field]);
        delete debounceTimersRef.current[field];
      }
    }
  };

  const onSubmit = async (data: CreatePartnerFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create partner");
      }

      toast.success("Partner created successfully");
      router.push("/dashboard/partners");
      router.refresh();
    } catch (error) {
      console.error("Error creating partner:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/partners">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to partners</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Partner</h1>
          <p className="text-muted-foreground">Add a new partner to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Details</CardTitle>
          <CardDescription>Enter the information for the new partner</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DIRECT">Direct</SelectItem>
                          <SelectItem value="BROKER">Broker</SelectItem>
                          <SelectItem value="INSURER">Insurer</SelectItem>
                          <SelectItem value="BODYSHOP">Bodyshop</SelectItem>
                          <SelectItem value="DEALERSHIP">Dealership</SelectItem>
                          <SelectItem value="FLEET">Fleet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the type of partner</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter partner name" {...field} />
                      </FormControl>
                      <FormDescription>The name of the partner</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormDescription>Contact email address (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormDescription>Contact phone number (optional)</FormDescription>
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
                      <Textarea placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormDescription>Physical address (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Provider Relations */}
              <div className="col-span-full">
                <h3 className="mb-4 text-lg font-semibold">Service Provider Relations</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Vehicle Recovery */}
                  <FormField
                    control={form.control}
                    name="vehicleRecoveryId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vehicle Recovery</FormLabel>
                        <Popover
                          open={serviceProviderStates.vehicleRecovery.open}
                          onOpenChange={(open) => handleOpenChange("vehicleRecovery", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.vehicleRecovery.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.vehicleRecovery.selected
                                  ? serviceProviderStates.vehicleRecovery.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.vehicleRecovery.query}
                                onValueChange={(value) => handleQueryChange("vehicleRecovery", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.vehicleRecovery.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.vehicleRecovery.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              vehicleRecovery: {
                                                ...prev.vehicleRecovery,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("vehicleRecoveryId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.vehicleRecovery.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.vehicleRecovery.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                vehicleRecovery: { ...prev.vehicleRecovery, selected: null },
                              }));
                              form.setValue("vehicleRecoveryId", "");
                            }}
                          >
                            Clear selection
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehicle Storage */}
                  <FormField
                    control={form.control}
                    name="vehicleStorageId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vehicle Storage</FormLabel>
                        <Popover
                          open={serviceProviderStates.vehicleStorage.open}
                          onOpenChange={(open) => handleOpenChange("vehicleStorage", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.vehicleStorage.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.vehicleStorage.selected
                                  ? serviceProviderStates.vehicleStorage.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.vehicleStorage.query}
                                onValueChange={(value) => handleQueryChange("vehicleStorage", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.vehicleStorage.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.vehicleStorage.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              vehicleStorage: {
                                                ...prev.vehicleStorage,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("vehicleStorageId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.vehicleStorage.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.vehicleStorage.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                vehicleStorage: { ...prev.vehicleStorage, selected: null },
                              }));
                              form.setValue("vehicleStorageId", "");
                            }}
                          >
                            Clear selection
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Replacement Hire */}
                  <FormField
                    control={form.control}
                    name="replacementHireId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Replacement Hire</FormLabel>
                        <Popover
                          open={serviceProviderStates.replacementHire.open}
                          onOpenChange={(open) => handleOpenChange("replacementHire", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.replacementHire.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.replacementHire.selected
                                  ? serviceProviderStates.replacementHire.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.replacementHire.query}
                                onValueChange={(value) => handleQueryChange("replacementHire", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.replacementHire.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.replacementHire.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              replacementHire: {
                                                ...prev.replacementHire,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("replacementHireId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.replacementHire.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.replacementHire.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                replacementHire: { ...prev.replacementHire, selected: null },
                              }));
                              form.setValue("replacementHireId", "");
                            }}
                          >
                            Clear selection
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehicle Repairs */}
                  <FormField
                    control={form.control}
                    name="vehicleRepairsId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vehicle Repairs</FormLabel>
                        <Popover
                          open={serviceProviderStates.vehicleRepairs.open}
                          onOpenChange={(open) => handleOpenChange("vehicleRepairs", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.vehicleRepairs.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.vehicleRepairs.selected
                                  ? serviceProviderStates.vehicleRepairs.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.vehicleRepairs.query}
                                onValueChange={(value) => handleQueryChange("vehicleRepairs", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.vehicleRepairs.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.vehicleRepairs.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              vehicleRepairs: {
                                                ...prev.vehicleRepairs,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("vehicleRepairsId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.vehicleRepairs.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.vehicleRepairs.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                vehicleRepairs: { ...prev.vehicleRepairs, selected: null },
                              }));
                              form.setValue("vehicleRepairsId", "");
                            }}
                          >
                            Clear selection
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Independent Engineer */}
                  <FormField
                    control={form.control}
                    name="independentEngineerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Independent Engineer</FormLabel>
                        <Popover
                          open={serviceProviderStates.independentEngineer.open}
                          onOpenChange={(open) => handleOpenChange("independentEngineer", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.independentEngineer.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.independentEngineer.selected
                                  ? serviceProviderStates.independentEngineer.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.independentEngineer.query}
                                onValueChange={(value) => handleQueryChange("independentEngineer", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.independentEngineer.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.independentEngineer.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              independentEngineer: {
                                                ...prev.independentEngineer,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("independentEngineerId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.independentEngineer.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.independentEngineer.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                independentEngineer: { ...prev.independentEngineer, selected: null },
                              }));
                              form.setValue("independentEngineerId", "");
                            }}
                          >
                            Clear selection
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehicle Inspection */}
                  <FormField
                    control={form.control}
                    name="vehicleInspectionId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Vehicle Inspection</FormLabel>
                        <Popover
                          open={serviceProviderStates.vehicleInspection.open}
                          onOpenChange={(open) => handleOpenChange("vehicleInspection", open)}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !serviceProviderStates.vehicleInspection.selected && "text-muted-foreground",
                                )}
                                type="button"
                              >
                                {serviceProviderStates.vehicleInspection.selected
                                  ? serviceProviderStates.vehicleInspection.selected.name
                                  : "Search service provider..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search service providers..."
                                value={serviceProviderStates.vehicleInspection.query}
                                onValueChange={(value) => handleQueryChange("vehicleInspection", value)}
                              />
                              <CommandList>
                                {serviceProviderStates.vehicleInspection.searching ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No service providers found.</CommandEmpty>
                                    <CommandGroup>
                                      {serviceProviderStates.vehicleInspection.providers.map((provider) => (
                                        <CommandItem
                                          key={provider.id}
                                          value={provider.name}
                                          onSelect={() => {
                                            setServiceProviderStates((prev) => ({
                                              ...prev,
                                              vehicleInspection: {
                                                ...prev.vehicleInspection,
                                                selected: provider,
                                                open: false,
                                              },
                                            }));
                                            form.setValue("vehicleInspectionId", provider.id);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              serviceProviderStates.vehicleInspection.selected?.id === provider.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <span>{provider.name}</span>
                                          <span className="text-muted-foreground ml-2 text-xs">({provider.type})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {serviceProviderStates.vehicleInspection.selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => {
                              setServiceProviderStates((prev) => ({
                                ...prev,
                                vehicleInspection: { ...prev.vehicleInspection, selected: null },
                              }));
                              form.setValue("vehicleInspectionId", "");
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
              </div>

              <div className="flex items-center justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/partners">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create Partner
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
