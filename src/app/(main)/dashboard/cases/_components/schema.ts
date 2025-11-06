import z from "zod";

export const caseFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  uploadedAt: z.string(),
});

export const caseSchema = z.object({
  id: z.string(),
  title: z.string(),
  client: z.string(),
  status: z.string(),
  priority: z.string(),
  assignedTo: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string().optional(),
  statusDateTime: z.string().optional(),
  files: z.array(caseFileSchema).optional(),
  statusHistory: z
    .array(
      z.object({
        status: z.string(),
        dateTime: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

