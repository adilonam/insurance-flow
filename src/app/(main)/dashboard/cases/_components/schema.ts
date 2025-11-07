import z from "zod";

export const caseFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  uploadedAt: z.string(),
});

export const initialAssessmentSchema = z.object({
  // Initial Assessment
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
  timeOfAccident: z.string().optional(),
  livedInCurrentAddress3Years: z.string().optional(), // Y/N
  address2: z.string().optional(),
  address2Dates: z.string().optional(),
  address3: z.string().optional(),
  address3Dates: z.string().optional(),
  
  // Defendant Details
  defendantName: z.string().optional(),
  defendantReg: z.string().optional(),
  defendantContactNumber: z.string().optional(),
  defendantMakeModelColor: z.string().optional(),
  
  // Claimant Details
  claimantVehicleRegistration: z.string().optional(),
  claimantInsurer: z.string().optional(),
  claimantMakeModel: z.string().optional(),
  mainPolicyHolder: z.string().optional(), // Y/N
  additionalDriver1: z.string().optional(),
  additionalDriver2: z.string().optional(),
  additionalDriver3: z.string().optional(),
  noClaimsBonus: z.string().optional(), // Y/N
  insuranceType: z.string().optional(), // Fully Comp / TPFT / TP
  dateLicenceObtained: z.string().optional(),
  occupation: z.string().optional(),
  ukResidentFromBirth: z.string().optional(), // Y/N
  ukResidentSince: z.string().optional(),
  vehicleValidMOTAndTax: z.string().optional(), // Y/N
  everDeclaredBankrupt: z.string().optional(), // Y/N
  claimantClaimingInjury: z.string().optional(), // Y/N
  additionalInformation: z.string().optional(),
  accessToOtherVehicles: z.string().optional(),
  ownTheVehicle: z.string().optional(), // Y/N
  vehicleOwnerRelationship: z.string().optional(),
  carOnFinance: z.string().optional(), // Y/N
  workInMotorTrade: z.string().optional(), // Y/N
  needForPrestigeVehicle: z.string().optional(), // Y/N
  
  // Private Hire Driver
  privateHireLicenceYears: z.string().optional(),
  taxiIncomePercent: z.string().optional(),
  additionalEmployment: z.string().optional(),
  
  // Witness Details
  witnessName: z.string().optional(),
  witnessContactNumber: z.string().optional(),
  witnessDetailsObtained: z.string().optional(),
  witnessRelationToClaimant: z.string().optional(),
  witnessAdditionalInformation: z.string().optional(),
  
  // Insurance Eligibility Questions
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

export const caseSchema = z.object({
  id: z.string(),
  title: z.string(),
  client: z.string(),
  status: z.string(),
  priority: z.string(),
  assignedTo: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string().optional(),
  statusDateTime: z.string().optional(),
  files: z.array(caseFileSchema).optional(),
  statusHistory: z
    .array(
      z.object({
        status: z.string(),
        dateTime: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  initialAssessment: initialAssessmentSchema.optional(),
});

