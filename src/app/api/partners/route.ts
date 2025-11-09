import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PartnerType } from "@/generated/prisma/client";

const createPartnerSchema = z.object({
  type: z.enum(["DIRECT", "BROKER", "INSURER", "BODYSHOP", "DEALERSHIP", "FLEET"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  vehicleRecoveryId: z.string().optional(),
  vehicleStorageId: z.string().optional(),
  replacementHireId: z.string().optional(),
  vehicleRepairsId: z.string().optional(),
  independentEngineerId: z.string().optional(),
  vehicleInspectionId: z.string().optional(),
});

const updatePartnerSchema = z.object({
  type: z.enum(["DIRECT", "BROKER", "INSURER", "BODYSHOP", "DEALERSHIP", "FLEET"]).optional(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET - List all partners
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partners = await prisma.partner.findMany({
      include: {
        vehicleRecovery: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        vehicleStorage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        replacementHire: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        vehicleRepairs: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        independentEngineer: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        vehicleInspection: {
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

    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

// POST - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPartnerSchema.parse(body);

    // Map type string to enum
    const typeMap: Record<string, PartnerType> = {
      DIRECT: PartnerType.DIRECT,
      BROKER: PartnerType.BROKER,
      INSURER: PartnerType.INSURER,
      BODYSHOP: PartnerType.BODYSHOP,
      DEALERSHIP: PartnerType.DEALERSHIP,
      FLEET: PartnerType.FLEET,
    };

    const partner = await prisma.partner.create({
      data: {
        type: typeMap[validatedData.type] || PartnerType.DIRECT,
        name: validatedData.name,
        email: validatedData.email && validatedData.email.trim() !== "" ? validatedData.email : null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        vehicleRecoveryId:
          validatedData.vehicleRecoveryId && validatedData.vehicleRecoveryId.trim() !== ""
            ? validatedData.vehicleRecoveryId
            : null,
        vehicleStorageId:
          validatedData.vehicleStorageId && validatedData.vehicleStorageId.trim() !== ""
            ? validatedData.vehicleStorageId
            : null,
        replacementHireId:
          validatedData.replacementHireId && validatedData.replacementHireId.trim() !== ""
            ? validatedData.replacementHireId
            : null,
        vehicleRepairsId:
          validatedData.vehicleRepairsId && validatedData.vehicleRepairsId.trim() !== ""
            ? validatedData.vehicleRepairsId
            : null,
        independentEngineerId:
          validatedData.independentEngineerId && validatedData.independentEngineerId.trim() !== ""
            ? validatedData.independentEngineerId
            : null,
        vehicleInspectionId:
          validatedData.vehicleInspectionId && validatedData.vehicleInspectionId.trim() !== ""
            ? validatedData.vehicleInspectionId
            : null,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating partner:", error);
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
