import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClaimType, ClaimStatus } from "@/generated/prisma/client";

const updateClaimSchema = z.object({
  dateOfAccident: z.string().optional(),
  type: z.enum(["FAULT", "NON_FAULT"]).optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  clientName: z.string().min(1, "Client name is required").optional(),
  clientMobile: z.string().min(1, "Client mobile is required").optional(),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientDob: z.string().min(1, "Client date of birth is required").optional(),
  clientPostCode: z.string().min(1, "Client post code is required").optional(),
  isPrivateHireDriver: z.string().optional().or(z.literal("")),
});

// GET - Get a claim by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const claim = await prisma.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
  }
}

// PUT - Update a claim
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateClaimSchema.parse(body);

    // Check if claim exists
    const existing = await prisma.claim.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Map type and status strings to enums
    const typeMap: Record<string, ClaimType> = {
      FAULT: ClaimType.FAULT,
      NON_FAULT: ClaimType.NON_FAULT,
    };

    const statusMap: Record<string, ClaimStatus> = {
      PENDING_TRIAGE: ClaimStatus.PENDING_TRIAGE,
      ACCEPTED: ClaimStatus.ACCEPTED,
      REJECTED: ClaimStatus.REJECTED,
      IN_PROGRESS_SERVICES: ClaimStatus.IN_PROGRESS_SERVICES,
      IN_PROGRESS_REPAIRS: ClaimStatus.IN_PROGRESS_REPAIRS,
      PENDING_OFFBOARDING: ClaimStatus.PENDING_OFFBOARDING,
      PENDING_OFFBOARDING_NONCOOPERATIVE: ClaimStatus.PENDING_OFFBOARDING_NONCOOPERATIVE,
      PAYMENT_PACK_PREPARATION: ClaimStatus.PAYMENT_PACK_PREPARATION,
      AWAITING_FINAL_PAYMENT: ClaimStatus.AWAITING_FINAL_PAYMENT,
      CLOSED: ClaimStatus.CLOSED,
    };

    const updateData: {
      dateOfAccident?: Date;
      type?: ClaimType;
      status?: ClaimStatus;
      clientName?: string;
      clientMobile?: string;
      clientEmail?: string | null;
      clientDob?: Date;
      clientPostCode?: string;
      isPrivateHireDriver?: string | null;
    } = {};

    if (validatedData.dateOfAccident !== undefined) {
      updateData.dateOfAccident = new Date(validatedData.dateOfAccident);
    }
    if (validatedData.type !== undefined) {
      updateData.type = typeMap[validatedData.type] || ClaimType.NON_FAULT;
    }
    if (validatedData.status !== undefined) {
      updateData.status = statusMap[validatedData.status] || ClaimStatus.PENDING_TRIAGE;
    }
    if (validatedData.clientName !== undefined) {
      updateData.clientName = validatedData.clientName;
    }
    if (validatedData.clientMobile !== undefined) {
      updateData.clientMobile = validatedData.clientMobile;
    }
    if (validatedData.clientDob !== undefined) {
      updateData.clientDob = new Date(validatedData.clientDob);
    }
    if (validatedData.clientPostCode !== undefined) {
      updateData.clientPostCode = validatedData.clientPostCode;
    }
    if (validatedData.clientEmail !== undefined) {
      updateData.clientEmail =
        validatedData.clientEmail && validatedData.clientEmail.trim() !== ""
          ? validatedData.clientEmail
          : null;
    }
    if (validatedData.isPrivateHireDriver !== undefined) {
      updateData.isPrivateHireDriver =
        validatedData.isPrivateHireDriver && validatedData.isPrivateHireDriver.trim() !== ""
          ? validatedData.isPrivateHireDriver
          : null;
    }

    const claim = await prisma.claim.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(claim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

// DELETE - Delete a claim
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if claim exists
    const existing = await prisma.claim.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    await prisma.claim.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting claim:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}
