import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClaimType, ClaimStatus } from "@/generated/prisma/client";

const createClaimSchema = z.object({
  dateOfAccident: z.string().min(1, "Date of accident is required"),
  type: z.enum(["FAULT", "NON_FAULT"]),
  status: z.enum([
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
  ]),
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
  clientDob: z.string().min(1, "Client date of birth is required").optional(),
  clientPostCode: z.string().min(1, "Client post code is required").optional(),
  additionalDriverName: z.string().optional().or(z.literal("")),
  additionalDriverMobile: z.string().optional().or(z.literal("")),
  additionalDriverDob: z.string().optional().or(z.literal("")),
  additionalDriverPostCode: z.string().optional().or(z.literal("")),
  tpiInsurerName: z.string().optional().or(z.literal("")),
  tpiInsurerContact: z.string().optional().or(z.literal("")),
});

// GET - List all claims
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await prisma.claim.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

// POST - Create a new claim
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createClaimSchema.parse(body);

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

    const claim = await prisma.claim.create({
      data: {
        dateOfAccident: new Date(validatedData.dateOfAccident),
        type: typeMap[validatedData.type] || ClaimType.NON_FAULT,
        status: statusMap[validatedData.status] || ClaimStatus.PENDING_TRIAGE,
        clientName: validatedData.clientName,
        clientMobile: validatedData.clientMobile,
        clientDob: new Date(validatedData.clientDob),
        clientPostCode: validatedData.clientPostCode,
        additionalDriverName:
          validatedData.additionalDriverName && validatedData.additionalDriverName.trim() !== ""
            ? validatedData.additionalDriverName
            : null,
        additionalDriverMobile:
          validatedData.additionalDriverMobile && validatedData.additionalDriverMobile.trim() !== ""
            ? validatedData.additionalDriverMobile
            : null,
        additionalDriverDob:
          validatedData.additionalDriverDob && validatedData.additionalDriverDob.trim() !== ""
            ? new Date(validatedData.additionalDriverDob)
            : null,
        additionalDriverPostCode:
          validatedData.additionalDriverPostCode && validatedData.additionalDriverPostCode.trim() !== ""
            ? validatedData.additionalDriverPostCode
            : null,
        tpiInsurerName:
          validatedData.tpiInsurerName && validatedData.tpiInsurerName.trim() !== ""
            ? validatedData.tpiInsurerName
            : null,
        tpiInsurerContact:
          validatedData.tpiInsurerContact && validatedData.tpiInsurerContact.trim() !== ""
            ? validatedData.tpiInsurerContact
            : null,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}

