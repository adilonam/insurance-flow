// Case Status Definitions
export const CASE_STATUSES = [
  { id: "1", label: "Initial Assessment", order: 1, enum: "INITIAL_ASSESSMENT" },
  { id: "2", label: "Accident Images", order: 2, enum: "ACCIDENT_IMAGES" },
  { id: "3", label: "Client ID & Proof of Address", order: 3, enum: "CLIENT_ID_PROOF_OF_ADDRESS" },
  { id: "3.1", label: "Client Vehicle Documents", order: 3.1, enum: "CLIENT_VEHICLE_DOCUMENTS" },
  { id: "3.2", label: "Authorisation & Mitigation Statement", order: 3.2, enum: "AUTHORISATION_MITIGATION_STATEMENT" },
  { id: "3.3", label: "Isagi Check", order: 3.3, enum: "ISAGI_CHECK" },
  {
    id: "3.4",
    label: "3 Months Bank Statements Prior To accident date",
    order: 3.4,
    enum: "THREE_MONTHS_BANK_STATEMENTS",
  },
  { id: "4", label: "AskMID Search", order: 4, enum: "ASKMID_SEARCH" },
  { id: "5", label: "DVLA Licence Check", order: 5, enum: "DVLA_LICENCE_CHECK" },
  { id: "6", label: "Hire Vehicle Documents", order: 6, enum: "HIRE_VEHICLE_DOCUMENTS" },
  { id: "7", label: "HSR Agreements", order: 7, enum: "HSR_AGREEMENTS" },
  { id: "8", label: "Permission Letter", order: 8, enum: "PERMISSION_LETTER" },
  { id: "9", label: "Stripe Details", order: 9, enum: "STRIPE_DETAILS" },
  { id: "10", label: "Damage checklist", order: 10, enum: "DAMAGE_CHECKLIST" },
  { id: "11", label: "Client Questionnaires", order: 11, enum: "CLIENT_QUESTIONNAIRES" },
  { id: "12", label: "Offboarding", order: 12, enum: "OFFBOARDING" },
  { id: "13", label: "BHR Report", order: 13, enum: "BHR_REPORT" },
  { id: "14", label: "Canford Law Setup", order: 14, enum: "CANFORD_LAW_SETUP" },
  { id: "15", label: "Non Co-Operative Client", order: 15, enum: "NON_CO_OPERATIVE_CLIENT" },
] as const;

export type CaseStatusId = (typeof CASE_STATUSES)[number]["id"];

// Get status by ID
export function getStatusById(id: string) {
  return CASE_STATUSES.find((s) => s.id === id);
}

// Get status by enum
export function getStatusByEnum(enumValue: string) {
  return CASE_STATUSES.find((s) => s.enum === enumValue);
}

// Get next status ID
export function getNextStatus(currentStatusId: string): CaseStatusId | null {
  const current = getStatusById(currentStatusId);
  if (!current) return null;
  const currentIndex = CASE_STATUSES.findIndex((s) => s.id === currentStatusId);
  if (currentIndex === -1 || currentIndex === CASE_STATUSES.length - 1) return null;
  return CASE_STATUSES[currentIndex + 1].id;
}

// Get previous status ID
export function getPreviousStatus(currentStatusId: string): CaseStatusId | null {
  const current = getStatusById(currentStatusId);
  if (!current) return null;
  const currentIndex = CASE_STATUSES.findIndex((s) => s.id === currentStatusId);
  if (currentIndex <= 0) return null;
  return CASE_STATUSES[currentIndex - 1].id;
}

// Map Prisma CaseStatus enum directly to display label
export function mapStatusEnumToLabel(status: string): string {
  const statusData = getStatusByEnum(status);
  return statusData ? `${statusData.id}. ${statusData.label}` : status;
}

// Helper to get status ID from enum (for components that need ID)
export function getStatusIdFromEnum(status: string): string {
  const statusData = getStatusByEnum(status);
  return statusData?.id || status;
}

// Map priority enum to display format
export function mapPriorityEnumToDisplay(priority: string): string {
  const priorityMap: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };

  return priorityMap[priority] || priority;
}
