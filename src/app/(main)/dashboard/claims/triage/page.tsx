import { ClaimStats } from "./_components/claim-stats";
import { TriageClaimsTable } from "./_components/triage-claims-table";

export default function TriageClaimsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ClaimStats />
      <TriageClaimsTable />
    </div>
  );
}
