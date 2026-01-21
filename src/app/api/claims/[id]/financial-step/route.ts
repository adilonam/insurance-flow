import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Get financial step with bank accounts
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const financialStep = await prisma.financialStep.findUnique({
      where: { claimId: id },
      include: {
        bankAccounts: {
          include: {
            bankStatements: {
              orderBy: {
                startDate: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(financialStep);
  } catch (error) {
    console.error("Error fetching financial step:", error);
    return NextResponse.json({ error: "Failed to fetch financial step" }, { status: 500 });
  }
}

// POST - Create or update financial step with bank accounts
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { bankAccounts } = body;

    // Check if claim exists
    const claim = await prisma.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Find or create financial step
    let financialStep = await prisma.financialStep.findUnique({
      where: { claimId: id },
    });

    if (!financialStep) {
      financialStep = await prisma.financialStep.create({
        data: {
          claimId: id,
        },
      });
    }

    // Delete existing bank accounts
    await prisma.bankAccount.deleteMany({
      where: { financialStepId: financialStep.id },
    });

    // Create new bank accounts
    if (bankAccounts && Array.isArray(bankAccounts) && bankAccounts.length > 0) {
      await prisma.bankAccount.createMany({
        data: bankAccounts.map((account: any) => ({
          financialStepId: financialStep.id,
          bankName: account.bankName || null,
          accountNumber: account.accountNumber || null,
          accountType: account.accountType || null,
          last4: account.last4 || null,
          balance: account.balance ? parseFloat(account.balance.toString()) : null,
          overdraftLimit: account.overdraftLimit ? parseFloat(account.overdraftLimit.toString()) : null,
          overdraftUsed: account.overdraftUsed ? parseFloat(account.overdraftUsed.toString()) : null,
          status: account.status || null,
        })),
      });
    }

    // Return updated financial step with bank accounts
    const updatedFinancialStep = await prisma.financialStep.findUnique({
      where: { id: financialStep.id },
      include: {
        bankAccounts: {
          include: {
            bankStatements: {
              orderBy: {
                startDate: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedFinancialStep);
  } catch (error) {
    console.error("Error saving financial step:", error);
    return NextResponse.json({ error: "Failed to save financial step" }, { status: 500 });
  }
}
