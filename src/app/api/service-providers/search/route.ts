import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Search service providers by name
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    const serviceProviders = await prisma.serviceProvider.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : undefined,
      take: 10,
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    return NextResponse.json(serviceProviders);
  } catch (error) {
    console.error("Error searching service providers:", error);
    return NextResponse.json({ error: "Failed to search service providers" }, { status: 500 });
  }
}
