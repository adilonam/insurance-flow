import { ServiceProvidersTable } from "./_components/service-providers-table";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <ServiceProvidersTable />
    </div>
  );
}
