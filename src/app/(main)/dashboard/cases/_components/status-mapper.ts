// Map Prisma CaseStatus enum to case-statuses.ts IDs
export function mapStatusEnumToId(status: string): string {
  const statusMap: Record<string, string> = {
    INITIAL_ASSESSMENT: "1",
    ACCIDENT_IMAGES: "2",
    CLIENT_ID_PROOF_OF_ADDRESS: "3",
    CLIENT_VEHICLE_DOCUMENTS: "3.1",
    AUTHORISATION_MITIGATION_STATEMENT: "3.2",
    ISAGI_CHECK: "3.3",
    THREE_MONTHS_BANK_STATEMENTS: "3.4",
    ASKMID_SEARCH: "4",
    DVLA_LICENCE_CHECK: "5",
    HIRE_VEHICLE_DOCUMENTS: "6",
    HSR_AGREEMENTS: "7",
    PERMISSION_LETTER: "8",
    STRIPE_DETAILS: "9",
    DAMAGE_CHECKLIST: "10",
    CLIENT_QUESTIONNAIRES: "11",
    OFFBOARDING: "12",
    BHR_REPORT: "13",
    CANFORD_LAW_SETUP: "14",
    NON_CO_OPERATIVE_CLIENT: "15",
  };

  return statusMap[status] || status;
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

