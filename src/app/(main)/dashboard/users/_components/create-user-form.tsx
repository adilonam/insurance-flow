"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Schema for user creation
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional().or(z.literal("")),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["USER", "PARTNER", "ADMIN"], {
    required_error: "Role is required",
  }),
  partnerId: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type Partner = {
  id: string;
  name: string;
  type: string;
};

export function CreateUserForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
      partnerId: "",
    },
  });

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

  // Track debounce timer and previous query
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevQueryRef = useRef<string>("");

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (query: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Update query in state
      setPartnerState((prev) => ({
        ...prev,
        query,
      }));

      // Only search if query actually changed
      const prevQuery = prevQueryRef.current || "";
      if (query !== prevQuery) {
        prevQueryRef.current = query;

        // Debounce the search
        debounceTimerRef.current = setTimeout(() => {
          searchPartners(query);
        }, 300);
      }
    },
    [searchPartners],
  );

  // Load initial partners when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setPartnerState((prev) => ({
      ...prev,
      open,
      query: "",
    }));

    if (open) {
      // Always load first 10 when opening
      prevQueryRef.current = "";
      searchPartners("");
    } else {
      // Clear timer when closing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = undefined;
      }
    }
  };

  const onSubmit = async (data: CreateUserFormValues) => {
    try {
      setIsSubmitting(true);

      const payload: any = {
        email: data.email,
        role: data.role,
      };

      if (data.name && data.name.trim() !== "") {
        payload.name = data.name;
      }

      if (data.password && data.password.trim() !== "") {
        payload.password = data.password;
      }

      if (data.partnerId && data.partnerId.trim() !== "") {
        payload.partnerId = data.partnerId;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("User created successfully");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to users</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Enter the information for the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user name" {...field} />
                      </FormControl>
                      <FormDescription>User&apos;s full name (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormDescription>User&apos;s email address (required)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password (min 6 characters)" {...field} />
                      </FormControl>
                      <FormDescription>Password for credentials authentication (optional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="PARTNER">Partner</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>User&apos;s role in the system</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Partner</FormLabel>
                    <Popover open={partnerState.open} onOpenChange={handleOpenChange}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("w-full justify-between", !partnerState.selected && "text-muted-foreground")}
                            type="button"
                          >
                            {partnerState.selected ? partnerState.selected.name : "Search partner..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search partners..."
                            value={partnerState.query}
                            onValueChange={handleQueryChange}
                          />
                          <CommandList>
                            {partnerState.searching ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>No partners found.</CommandEmpty>
                                <CommandGroup>
                                  {partnerState.partners.map((partner) => (
                                    <CommandItem
                                      key={partner.id}
                                      value={partner.name}
                                      onSelect={() => {
                                        setPartnerState((prev) => ({
                                          ...prev,
                                          selected: partner,
                                          open: false,
                                        }));
                                        form.setValue("partnerId", partner.id);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          partnerState.selected?.id === partner.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <span>{partner.name}</span>
                                      <span className="text-muted-foreground ml-2 text-xs">({partner.type})</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {partnerState.selected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 px-2 text-xs"
                        onClick={() => {
                          setPartnerState((prev) => ({
                            ...prev,
                            selected: null,
                          }));
                          form.setValue("partnerId", "");
                        }}
                      >
                        Clear selection
                      </Button>
                    )}
                    <FormDescription>Associate user with a partner (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
