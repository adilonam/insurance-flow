import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Get a case by ID with InitialAssessment
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const caseData = await prisma.case.findUnique({
      where: { id },
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
        initialAssessments: {
          take: 1, // Get the most recent one
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 });
  }
}
