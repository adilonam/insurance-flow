import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ClaimType, ClaimStatus } from "@/generated/prisma/client";

const createClaimSchema = z.object({
  type: z.enum(["FAULT", "NON_FAULT"]),
  status: z.enum([
    "PENDING_TRIAGE",
    "PENDING_FINANCIAL",
    "PENDING_LIVE_CLAIMS",
    "PENDING_OS_DOCS",
    "PENDING_PAYMENT_PACK_REVIEW",
    "PENDING_SENT_TO_TP",
    "PENDING_SENT_TO_SOLS",
    "PENDING_ISSUED",
  ]),
  partnerId: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientMobile: z.string().min(1, "Client mobile is required"),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientDob: z.string().min(1, "Client date of birth is required"),
  clientPostCode: z.string().min(1, "Client post code is required"),
  vehicleRegistration: z.string().min(1, "Vehicle registration is required"),
  isPrivateHireDriver: z.string().optional().or(z.literal("")),
  dateOfAccident: z.string().min(1, "Date of accident is required"),
  accidentTime: z.string().optional().or(z.literal("")),
  accidentLocation: z.string().min(1, "Accident location is required"),
  accidentCircumstances: z.string().min(1, "Accident circumstances are required"),
  isVehicleDrivable: z.string().min(1, "Please specify if vehicle is drivable"),
  thirdPartyName: z.string().optional().or(z.literal("")),
  thirdPartyVehicleRegistration: z.string().optional().or(z.literal("")),
  thirdPartyContactNumber: z.string().optional().or(z.literal("")),
});

const updateClaimSchema = z.object({
  dateOfAccident: z.string().optional(),
  type: z.enum(["FAULT", "NON_FAULT"]).optional(),
  status: z
    .enum([
      "PENDING_TRIAGE",
      "PENDING_FINANCIAL",
      "PENDING_LIVE_CLAIMS",
      "PENDING_OS_DOCS",
      "PENDING_PAYMENT_PACK_REVIEW",
      "PENDING_SENT_TO_TP",
      "PENDING_SENT_TO_SOLS",
      "PENDING_ISSUED",
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
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

    // Get user from session
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, partnerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine partnerId: use provided partnerId, fallback to user's partnerId, or null
    const partnerId = validatedData.partnerId || user.partnerId || null;

    // Map type and status strings to enums
    const typeMap: Record<string, ClaimType> = {
      FAULT: ClaimType.FAULT,
      NON_FAULT: ClaimType.NON_FAULT,
    };

    const statusMap: Record<string, ClaimStatus> = {
      PENDING_TRIAGE: ClaimStatus.PENDING_TRIAGE,
      PENDING_FINANCIAL: ClaimStatus.PENDING_FINANCIAL,
      PENDING_LIVE_CLAIMS: ClaimStatus.PENDING_LIVE_CLAIMS,
      PENDING_OS_DOCS: ClaimStatus.PENDING_OS_DOCS,
      PENDING_PAYMENT_PACK_REVIEW: ClaimStatus.PENDING_PAYMENT_PACK_REVIEW,
      PENDING_SENT_TO_TP: ClaimStatus.PENDING_SENT_TO_TP,
      PENDING_SENT_TO_SOLS: ClaimStatus.PENDING_SENT_TO_SOLS,
      PENDING_ISSUED: ClaimStatus.PENDING_ISSUED,
    };

    const claim = await prisma.claim.create({
      data: {
        dateOfAccident: new Date(validatedData.dateOfAccident),
        type: typeMap[validatedData.type] || ClaimType.NON_FAULT,
        status: statusMap[validatedData.status] || ClaimStatus.PENDING_TRIAGE,
        clientName: validatedData.clientName,
        clientMobile: validatedData.clientMobile,
        clientEmail:
          validatedData.clientEmail && validatedData.clientEmail.trim() !== ""
            ? validatedData.clientEmail
            : null,
        clientDob: new Date(validatedData.clientDob),
        clientPostCode: validatedData.clientPostCode,
        vehicleRegistration: validatedData.vehicleRegistration,
        isPrivateHireDriver:
          validatedData.isPrivateHireDriver && validatedData.isPrivateHireDriver.trim() !== ""
            ? validatedData.isPrivateHireDriver
            : null,
        accidentTime:
          validatedData.accidentTime && validatedData.accidentTime.trim() !== ""
            ? validatedData.accidentTime
            : null,
        accidentLocation: validatedData.accidentLocation,
        accidentCircumstances: validatedData.accidentCircumstances,
        isVehicleDrivable: validatedData.isVehicleDrivable,
        thirdPartyName:
          validatedData.thirdPartyName && validatedData.thirdPartyName.trim() !== ""
            ? validatedData.thirdPartyName
            : null,
        thirdPartyVehicleRegistration:
          validatedData.thirdPartyVehicleRegistration && validatedData.thirdPartyVehicleRegistration.trim() !== ""
            ? validatedData.thirdPartyVehicleRegistration
            : null,
        thirdPartyContactNumber:
          validatedData.thirdPartyContactNumber && validatedData.thirdPartyContactNumber.trim() !== ""
            ? validatedData.thirdPartyContactNumber
            : null,
        uploadedFileKey:
          validatedData.uploadedFileKey && validatedData.uploadedFileKey.trim() !== ""
            ? validatedData.uploadedFileKey
            : null,
        uploadedFileName: null, // Will be set when file is uploaded
        userId: user.id,
        partnerId: partnerId,
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
