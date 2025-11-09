import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PartnerType } from "@/generated/prisma/client";

const updatePartnerSchema = z.object({
  type: z.enum(["DIRECT", "BROKER", "INSURER", "BODYSHOP", "DEALERSHIP", "FLEET"]).optional(),
  name: z.string().min(1, "Name is required").optional(),
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

// GET - Get a partner by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json({ error: "Failed to fetch partner" }, { status: 500 });
  }
}

// PUT - Update a partner
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePartnerSchema.parse(body);

    // Check if partner exists
    const existing = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Map type string to enum if provided
    const typeMap: Record<string, PartnerType> = {
      DIRECT: PartnerType.DIRECT,
      BROKER: PartnerType.BROKER,
      INSURER: PartnerType.INSURER,
      BODYSHOP: PartnerType.BODYSHOP,
      DEALERSHIP: PartnerType.DEALERSHIP,
      FLEET: PartnerType.FLEET,
    };

    const updateData: {
      type?: PartnerType;
      name?: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      vehicleRecoveryId?: string | null;
      vehicleStorageId?: string | null;
      replacementHireId?: string | null;
      vehicleRepairsId?: string | null;
      independentEngineerId?: string | null;
      vehicleInspectionId?: string | null;
    } = {};

    if (validatedData.type !== undefined) {
      updateData.type = typeMap[validatedData.type] || PartnerType.DIRECT;
    }
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email && validatedData.email.trim() !== "" ? validatedData.email : null;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone || null;
    }
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address || null;
    }
    if (validatedData.vehicleRecoveryId !== undefined) {
      updateData.vehicleRecoveryId =
        validatedData.vehicleRecoveryId && validatedData.vehicleRecoveryId.trim() !== ""
          ? validatedData.vehicleRecoveryId
          : null;
    }
    if (validatedData.vehicleStorageId !== undefined) {
      updateData.vehicleStorageId =
        validatedData.vehicleStorageId && validatedData.vehicleStorageId.trim() !== ""
          ? validatedData.vehicleStorageId
          : null;
    }
    if (validatedData.replacementHireId !== undefined) {
      updateData.replacementHireId =
        validatedData.replacementHireId && validatedData.replacementHireId.trim() !== ""
          ? validatedData.replacementHireId
          : null;
    }
    if (validatedData.vehicleRepairsId !== undefined) {
      updateData.vehicleRepairsId =
        validatedData.vehicleRepairsId && validatedData.vehicleRepairsId.trim() !== ""
          ? validatedData.vehicleRepairsId
          : null;
    }
    if (validatedData.independentEngineerId !== undefined) {
      updateData.independentEngineerId =
        validatedData.independentEngineerId && validatedData.independentEngineerId.trim() !== ""
          ? validatedData.independentEngineerId
          : null;
    }
    if (validatedData.vehicleInspectionId !== undefined) {
      updateData.vehicleInspectionId =
        validatedData.vehicleInspectionId && validatedData.vehicleInspectionId.trim() !== ""
          ? validatedData.vehicleInspectionId
          : null;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(partner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating partner:", error);
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
  }
}

// DELETE - Delete a partner
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if partner exists
    const existing = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    await prisma.partner.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Partner deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 });
  }
}
