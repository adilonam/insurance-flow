import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Get offboarding step with documents
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const offboardingStep = await prisma.offboardingStep.findUnique({
      where: { claimId: id },
      include: {
        documents: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(offboardingStep);
  } catch (error) {
    console.error("Error fetching offboarding step:", error);
    return NextResponse.json({ error: "Failed to fetch offboarding step" }, { status: 500 });
  }
}
