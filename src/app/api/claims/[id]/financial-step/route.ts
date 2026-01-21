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
        creditCards: {
          include: {
            cardStatements: {
              orderBy: {
                startDate: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        loans: {
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
    const { bankAccounts, creditCards, loans } = body;

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

    // Only update the types that are provided in the request
    // This prevents deleting unrelated data when updating one type

    // Update bank accounts only if provided in request body
    if (bankAccounts !== undefined) {
      // Delete existing bank accounts
      await prisma.bankAccount.deleteMany({
        where: { financialStepId: financialStep.id },
      });

      // Create new bank accounts (even if empty array to clear all)
      if (Array.isArray(bankAccounts)) {
        if (bankAccounts.length > 0) {
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
        // If empty array, we've already deleted all, so nothing to create
      }
    }

    // Update credit cards only if provided in request body
    if (creditCards !== undefined) {
      // Delete existing credit cards
      await prisma.creditCard.deleteMany({
        where: { financialStepId: financialStep.id },
      });

      // Create new credit cards (even if empty array to clear all)
      if (Array.isArray(creditCards)) {
        if (creditCards.length > 0) {
          await prisma.creditCard.createMany({
            data: creditCards.map((card: any) => ({
              financialStepId: financialStep.id,
              issuer: card.issuer || null,
              last4: card.last4 || null,
              balance: card.balance ? parseFloat(card.balance.toString()) : null,
              limit: card.limit ? parseFloat(card.limit.toString()) : null,
              status: card.status || null,
            })),
          });
        }
        // If empty array, we've already deleted all, so nothing to create
      }
    }

    // Update loans only if provided in request body
    if (loans !== undefined) {
      // Delete existing loans
      await prisma.loan.deleteMany({
        where: { financialStepId: financialStep.id },
      });

      // Create new loans (even if empty array to clear all)
      if (Array.isArray(loans)) {
        if (loans.length > 0) {
          await prisma.loan.createMany({
            data: loans.map((loan: any) => ({
              financialStepId: financialStep.id,
              lender: loan.lender || null,
              balance: loan.balance ? parseFloat(loan.balance.toString()) : null,
              status: loan.status || null,
            })),
          });
        }
        // If empty array, we've already deleted all, so nothing to create
      }
    }

    // Return updated financial step with bank accounts and credit cards
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
        creditCards: {
          include: {
            cardStatements: {
              orderBy: {
                startDate: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        loans: {
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
