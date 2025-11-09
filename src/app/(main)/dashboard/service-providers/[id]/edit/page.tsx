import { EditServiceProviderForm } from "../../_components/edit-service-provider-form";

interface EditServiceProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServiceProviderPage({ params }: EditServiceProviderPageProps) {
  const { id } = await params;
  return <EditServiceProviderForm id={id} />;
}

