import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ServiceProviderType } from "@/generated/prisma/client";

const createServiceProviderSchema = z.object({
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateServiceProviderSchema = z.object({
  type: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET - List all service providers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceProviders = await prisma.serviceProvider.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(serviceProviders);
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return NextResponse.json({ error: "Failed to fetch service providers" }, { status: 500 });
  }
}

// POST - Create a new service provider
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createServiceProviderSchema.parse(body);

    // Map type string to enum
    const typeMap: Record<string, ServiceProviderType> = {
      INTERNAL: ServiceProviderType.INTERNAL,
      EXTERNAL: ServiceProviderType.EXTERNAL,
    };

    const serviceProvider = await prisma.serviceProvider.create({
      data: {
        type: typeMap[validatedData.type] || ServiceProviderType.EXTERNAL,
        name: validatedData.name,
        email: validatedData.email && validatedData.email.trim() !== "" ? validatedData.email : null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      },
    });

    return NextResponse.json(serviceProvider, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating service provider:", error);
    return NextResponse.json({ error: "Failed to create service provider" }, { status: 500 });
  }
}

