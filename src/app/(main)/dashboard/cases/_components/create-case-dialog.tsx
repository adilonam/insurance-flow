"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client name is required"),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "Priority is required",
  }),
  assignedTo: z.string().min(1, "Assigned to is required"),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (caseId: string) => void;
}

export function CreateCaseDialog({ open, onOpenChange, onSuccess }: CreateCaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: "",
      client: "",
      priority: "Medium",
      assignedTo: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        client: "",
        priority: "Medium",
        assignedTo: "",
      });
    }
  }, [open, form]);

  const onSubmit = async (data: CreateCaseFormValues) => {
    setIsSubmitting(true);
    try {
      // Import the createMockCase function dynamically to avoid circular dependencies
      const { createMockCase } = await import("./cases.config");
      const newCase = createMockCase({
        title: data.title,
        client: data.client,
        priority: data.priority,
        assignedTo: data.assignedTo,
      });

      toast.success("Case created successfully");
      form.reset();
      onOpenChange(false);
      // Call onSuccess after a brief delay to ensure state updates
      setTimeout(() => {
        onSuccess?.(newCase.id);
      }, 100);
    } catch (error) {
      toast.error("Failed to create case");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Create a new case. The case will be automatically set to &quot;Initial Assessment&quot; status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
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
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assignee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
