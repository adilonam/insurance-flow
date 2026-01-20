import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClaimStatus } from "@/generated/prisma/client";

// GET - Get claim statistics grouped by status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all claims grouped by status
    const claims = await prisma.claim.findMany({
      select: {
        status: true,
      },
    });

    // Initialize stats object with all possible statuses
    const statusCounts: Record<ClaimStatus, number> = {
      PENDING_TRIAGE: 0,
      PENDING_FINANCIAL: 0,
      PENDING_LIVE_CLAIMS: 0,
      PENDING_OS_DOCS: 0,
      PENDING_PAYMENT_PACK_REVIEW: 0,
      PENDING_SENT_TO_TP: 0,
      PENDING_SENT_TO_SOLS: 0,
      PENDING_ISSUED: 0,
    };

    // Count claims by status
    claims.forEach((claim) => {
      statusCounts[claim.status] = (statusCounts[claim.status] || 0) + 1;
    });

    // Calculate total
    const total = claims.length;

    return NextResponse.json({
      statusCounts,
      total,
    });
  } catch (error) {
    console.error("Error fetching claim stats:", error);
    return NextResponse.json({ error: "Failed to fetch claim stats" }, { status: 500 });
  }
}
