import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ServiceProviderType } from "@/generated/prisma/client";

const updateServiceProviderSchema = z.object({
  type: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET - Get a service provider by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!serviceProvider) {
      return NextResponse.json({ error: "Service provider not found" }, { status: 404 });
    }

    return NextResponse.json(serviceProvider);
  } catch (error) {
    console.error("Error fetching service provider:", error);
    return NextResponse.json({ error: "Failed to fetch service provider" }, { status: 500 });
  }
}

// PUT - Update a service provider
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateServiceProviderSchema.parse(body);

    // Check if service provider exists
    const existing = await prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service provider not found" }, { status: 404 });
    }

    // Map type string to enum if provided
    const typeMap: Record<string, ServiceProviderType> = {
      INTERNAL: ServiceProviderType.INTERNAL,
      EXTERNAL: ServiceProviderType.EXTERNAL,
    };

    const updateData: {
      type?: ServiceProviderType;
      name?: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    } = {};

    if (validatedData.type !== undefined) {
      updateData.type = typeMap[validatedData.type] || ServiceProviderType.EXTERNAL;
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

    const serviceProvider = await prisma.serviceProvider.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(serviceProvider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating service provider:", error);
    return NextResponse.json({ error: "Failed to update service provider" }, { status: 500 });
  }
}

// DELETE - Delete a service provider
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if service provider exists
    const existing = await prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service provider not found" }, { status: 404 });
    }

    await prisma.serviceProvider.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Service provider deleted successfully" });
  } catch (error) {
    console.error("Error deleting service provider:", error);
    return NextResponse.json({ error: "Failed to delete service provider" }, { status: 500 });
  }
}

