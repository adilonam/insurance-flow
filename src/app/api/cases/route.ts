import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CaseStatus, CasePriority } from "@/generated/prisma/client";

const createCaseSchema = z.object({
  // Case fields
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client name is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assignedTo: z.string().optional(),
  // Initial Assessment fields (all optional)
  claimReference: z.string().optional(),
  fullName: z.string().optional(),
  address: z.string().optional(),
  postCode: z.string().optional(),
  dateMovedIn: z.string().optional(),
  dateOfBirth: z.string().optional(),
  niNumber: z.string().optional(),
  dlNumber: z.string().optional(),
  dlIssue: z.string().optional(),
  dlExpiry: z.string().optional(),
  claimantContactNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  accidentLocation: z.string().optional(),
  accidentCircumstances: z.string().optional(),
  dateOfAccident: z.string().optional(),
  timeOfAccident: z.string().optional(), // Time as string (HH:mm format)
  livedInCurrentAddress3Years: z.string().optional(),
  address2: z.string().optional(),
  address2Dates: z.string().optional(),
  address3: z.string().optional(),
  address3Dates: z.string().optional(),
  defendantName: z.string().optional(),
  defendantReg: z.string().optional(),
  defendantContactNumber: z.string().optional(),
  defendantMakeModelColor: z.string().optional(),
  claimantVehicleRegistration: z.string().optional(),
  claimantInsurer: z.string().optional(),
  claimantMakeModel: z.string().optional(),
  mainPolicyHolder: z.string().optional(),
  additionalDriver1: z.string().optional(),
  additionalDriver2: z.string().optional(),
  additionalDriver3: z.string().optional(),
  noClaimsBonus: z.string().optional(),
  insuranceType: z.string().optional(),
  dateLicenceObtained: z.string().optional(),
  occupation: z.string().optional(),
  ukResidentFromBirth: z.string().optional(),
  ukResidentSince: z.string().optional(),
  vehicleValidMOTAndTax: z.string().optional(),
  everDeclaredBankrupt: z.string().optional(),
  claimantClaimingInjury: z.string().optional(),
  additionalInformation: z.string().optional(),
  accessToOtherVehicles: z.string().optional(),
  ownTheVehicle: z.string().optional(),
  vehicleOwnerRelationship: z.string().optional(),
  carOnFinance: z.string().optional(),
  workInMotorTrade: z.string().optional(),
  needForPrestigeVehicle: z.string().optional(),
  privateHireLicenceYears: z.string().optional(),
  taxiIncomePercent: z.string().optional(),
  additionalEmployment: z.string().optional(),
  witnessName: z.string().optional(),
  witnessContactNumber: z.string().optional(),
  witnessDetailsObtained: z.string().optional(),
  witnessRelationToClaimant: z.string().optional(),
  witnessAdditionalInformation: z.string().optional(),
  nonStandardDriver: z.boolean().optional(),
  agedBetween25And70: z.boolean().optional(),
  fullUKOrEUDrivingLicense2Years: z.boolean().optional(),
  taxiLicence1Year: z.boolean().optional(),
  ukResident3Years: z.boolean().optional(),
  noMoreThan9PenaltyPoints: z.boolean().optional(),
  notBannedFromDriving5Years: z.boolean().optional(),
  noMoreThan1FaultClaim2Years: z.boolean().optional(),
  noNonSpentCriminalConvictions: z.boolean().optional(),
  noDisabilityOrMedicalCondition: z.boolean().optional(),
});

// GET - List all cases
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cases = await prisma.case.findMany({
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

// POST - Create a new case
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCaseSchema.parse(body);

    // Generate caseId (C-1, C-2, etc.)
    // Find the highest case number
    const lastCase = await prisma.case.findFirst({
      orderBy: {
        caseId: "desc",
      },
      where: {
        caseId: {
          startsWith: "C-",
        },
      },
    });

    let nextCaseNumber = 1;
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseId.replace("C-", ""), 10);
      if (!isNaN(lastNumber)) {
        nextCaseNumber = lastNumber + 1;
      }
    }

    const caseId = `C-${nextCaseNumber}`;

    // Map priority string to enum
    const priorityMap: Record<string, CasePriority> = {
      LOW: CasePriority.LOW,
      MEDIUM: CasePriority.MEDIUM,
      HIGH: CasePriority.HIGH,
    };

    // Get current user ID from session
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Helper function to convert date string to Date or undefined
    const parseDate = (dateString: string | undefined): Date | undefined => {
      if (!dateString || dateString.trim() === "") return undefined;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    };

    // Extract InitialAssessment data
    const {
      title,
      client,
      priority,
      assignedTo,
      claimReference,
      fullName,
      address,
      postCode,
      dateMovedIn,
      dateOfBirth,
      niNumber,
      dlNumber,
      dlIssue,
      dlExpiry,
      claimantContactNumber,
      emailAddress,
      accidentLocation,
      accidentCircumstances,
      dateOfAccident,
      timeOfAccident,
      livedInCurrentAddress3Years,
      address2,
      address2Dates,
      address3,
      address3Dates,
      defendantName,
      defendantReg,
      defendantContactNumber,
      defendantMakeModelColor,
      claimantVehicleRegistration,
      claimantInsurer,
      claimantMakeModel,
      mainPolicyHolder,
      additionalDriver1,
      additionalDriver2,
      additionalDriver3,
      noClaimsBonus,
      insuranceType,
      dateLicenceObtained,
      occupation,
      ukResidentFromBirth,
      ukResidentSince,
      vehicleValidMOTAndTax,
      everDeclaredBankrupt,
      claimantClaimingInjury,
      additionalInformation,
      accessToOtherVehicles,
      ownTheVehicle,
      vehicleOwnerRelationship,
      carOnFinance,
      workInMotorTrade,
      needForPrestigeVehicle,
      privateHireLicenceYears,
      taxiIncomePercent,
      additionalEmployment,
      witnessName,
      witnessContactNumber,
      witnessDetailsObtained,
      witnessRelationToClaimant,
      witnessAdditionalInformation,
      nonStandardDriver,
      agedBetween25And70,
      fullUKOrEUDrivingLicense2Years,
      taxiLicence1Year,
      ukResident3Years,
      noMoreThan9PenaltyPoints,
      notBannedFromDriving5Years,
      noMoreThan1FaultClaim2Years,
      noNonSpentCriminalConvictions,
      noDisabilityOrMedicalCondition,
    } = validatedData;

    // Create Case and InitialAssessment in a transaction
    const newCase = await prisma.$transaction(async (tx) => {
      // Create the case
      const caseRecord = await tx.case.create({
        data: {
          caseId,
          title,
          client,
          status: CaseStatus.INITIAL_ASSESSMENT,
          priority: priorityMap[priority] || CasePriority.MEDIUM,
          assignedTo: assignedTo || null,
          createdBy: userId,
        },
      });

      // Create the initial assessment
      await tx.initialAssessment.create({
        data: {
          caseId: caseRecord.id,
          claimReference,
          fullName,
          address,
          postCode,
          dateMovedIn: parseDate(dateMovedIn),
          dateOfBirth: parseDate(dateOfBirth),
          niNumber,
          dlNumber,
          dlIssue: parseDate(dlIssue),
          dlExpiry: parseDate(dlExpiry),
          claimantContactNumber,
          emailAddress,
          accidentLocation,
          accidentCircumstances,
          dateOfAccident: parseDate(dateOfAccident),
          timeOfAccident, // Keep as string for time
          livedInCurrentAddress3Years,
          address2,
          address2Dates,
          address3,
          address3Dates,
          defendantName,
          defendantReg,
          defendantContactNumber,
          defendantMakeModelColor,
          claimantVehicleRegistration,
          claimantInsurer,
          claimantMakeModel,
          mainPolicyHolder,
          additionalDriver1,
          additionalDriver2,
          additionalDriver3,
          noClaimsBonus,
          insuranceType,
          dateLicenceObtained: parseDate(dateLicenceObtained),
          occupation,
          ukResidentFromBirth,
          ukResidentSince: parseDate(ukResidentSince),
          vehicleValidMOTAndTax,
          everDeclaredBankrupt,
          claimantClaimingInjury,
          additionalInformation,
          accessToOtherVehicles,
          ownTheVehicle,
          vehicleOwnerRelationship,
          carOnFinance,
          workInMotorTrade,
          needForPrestigeVehicle,
          privateHireLicenceYears,
          taxiIncomePercent,
          additionalEmployment,
          witnessName,
          witnessContactNumber,
          witnessDetailsObtained,
          witnessRelationToClaimant,
          witnessAdditionalInformation,
          nonStandardDriver,
          agedBetween25And70,
          fullUKOrEUDrivingLicense2Years,
          taxiLicence1Year,
          ukResident3Years,
          noMoreThan9PenaltyPoints,
          notBannedFromDriving5Years,
          noMoreThan1FaultClaim2Years,
          noNonSpentCriminalConvictions,
          noDisabilityOrMedicalCondition,
        },
      });

      // Return case with relations
      return await tx.case.findUnique({
        where: { id: caseRecord.id },
        include: {
          assignedToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating case:", error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
