import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CaseStatus, CasePriority } from "@/generated/prisma/client";

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client name is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assignedTo: z.string().optional(),
});

// GET - List all cases
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cases = await prisma.case.findMany({
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

// POST - Create a new case
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCaseSchema.parse(body);

    // Generate caseId (C-1, C-2, etc.)
    // Find the highest case number
    const lastCase = await prisma.case.findFirst({
      orderBy: {
        caseId: "desc",
      },
      where: {
        caseId: {
          startsWith: "C-",
        },
      },
    });

    let nextCaseNumber = 1;
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseId.replace("C-", ""), 10);
      if (!isNaN(lastNumber)) {
        nextCaseNumber = lastNumber + 1;
      }
    }

    const caseId = `C-${nextCaseNumber}`;

    // Map priority string to enum
    const priorityMap: Record<string, CasePriority> = {
      LOW: CasePriority.LOW,
      MEDIUM: CasePriority.MEDIUM,
      HIGH: CasePriority.HIGH,
    };

    // Get current user ID from session
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const newCase = await prisma.case.create({
      data: {
        caseId,
        title: validatedData.title,
        client: validatedData.client,
        status: CaseStatus.INITIAL_ASSESSMENT,
        priority: priorityMap[validatedData.priority] || CasePriority.MEDIUM,
        assignedTo: validatedData.assignedTo || null,
        createdBy: userId,
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating case:", error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
