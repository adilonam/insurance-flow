import { EditPartnerForm } from "../../_components/edit-partner-form";

interface EditPartnerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPartnerPage({ params }: EditPartnerPageProps) {
  const { id } = await params;
  return <EditPartnerForm id={id} />;
}
