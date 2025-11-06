export const CASE_STATUSES = [
  { id: "1", label: "Initial Assessment", order: 1 },
  { id: "2", label: "Accident Images", order: 2 },
  { id: "3", label: "Client ID & Proof of Address", order: 3 },
  { id: "3.1", label: "Client Vehicle Documents", order: 3.1 },
  { id: "3.2", label: "Authorisation & Mitigation Statement", order: 3.2 },
  { id: "3.3", label: "Isagi Check", order: 3.3 },
  { id: "3.4", label: "3 Months Bank Statements Prior To accident date", order: 3.4 },
  { id: "4", label: "AskMID Search", order: 4 },
  { id: "5", label: "DVLA Licence Check", order: 5 },
  { id: "6", label: "Hire Vehicle Documents", order: 6 },
  { id: "7", label: "HSR Agreements", order: 7 },
  { id: "8", label: "Permission Letter", order: 8 },
  { id: "9", label: "Stripe Details", order: 9 },
  { id: "10", label: "Damage checklist", order: 10 },
  { id: "11", label: "Client Questionnaires", order: 11 },
  { id: "12", label: "Offboarding", order: 12 },
  { id: "13", label: "BHR Report", order: 13 },
  { id: "14", label: "Canford Law Setup", order: 14 },
  { id: "15", label: "Non Co-Operative Client", order: 15 },
] as const;

export type CaseStatusId = (typeof CASE_STATUSES)[number]["id"];

export function getStatusById(id: string) {
  return CASE_STATUSES.find((s) => s.id === id);
}

export function getNextStatus(currentStatusId: string): CaseStatusId | null {
  const current = getStatusById(currentStatusId);
  if (!current) return null;
  const currentIndex = CASE_STATUSES.findIndex((s) => s.id === currentStatusId);
  if (currentIndex === -1 || currentIndex === CASE_STATUSES.length - 1) return null;
  return CASE_STATUSES[currentIndex + 1].id;
}

export function getPreviousStatus(currentStatusId: string): CaseStatusId | null {
  const current = getStatusById(currentStatusId);
  if (!current) return null;
  const currentIndex = CASE_STATUSES.findIndex((s) => s.id === currentStatusId);
  if (currentIndex <= 0) return null;
  return CASE_STATUSES[currentIndex - 1].id;
}

