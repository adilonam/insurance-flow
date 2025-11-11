import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/client";

const createUserSchema = z.object({
  name: z
    .preprocess(
      (val) => (val === "" || val === null ? null : val),
      z.union([z.string().min(1, "Name must be at least 1 character"), z.null()]),
    )
    .optional(),
  email: z.string().email("Invalid email address"),
  password: z
    .preprocess(
      (val) => (val === "" || val === null ? null : val),
      z.union([z.string().min(6, "Password must be at least 6 characters"), z.null()]),
    )
    .optional(),
  role: z.enum(["USER", "PARTNER", "ADMIN"]).optional(),
  partnerId: z
    .preprocess((val) => (val === "" || val === null ? null : val), z.union([z.string(), z.null()]))
    .optional(),
});

// GET - List all users or search users by email
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    // If query parameter exists, use search functionality
    if (query && query.trim().length > 0) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        take: 5,
        orderBy: {
          email: "asc",
        },
      });

      return NextResponse.json(users);
    }

    // Otherwise, return all users with partner relation
    const users = await prisma.user.findMany({
      include: {
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

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Map role string to enum
    const roleMap: Record<string, Role> = {
      USER: Role.USER,
      PARTNER: Role.PARTNER,
      ADMIN: Role.ADMIN,
    };

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (validatedData.password && validatedData.password.trim() !== "") {
      hashedPassword = await hash(validatedData.password, 12);
    }

    const user = await prisma.user.create({
      data: {
        name: validatedData.name && validatedData.name.trim() !== "" ? validatedData.name : null,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role ? roleMap[validatedData.role] || Role.USER : Role.USER,
        partnerId: validatedData.partnerId && validatedData.partnerId.trim() !== "" ? validatedData.partnerId : null,
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
