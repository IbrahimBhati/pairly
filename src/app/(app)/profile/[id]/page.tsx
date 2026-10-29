import { redirect } from "next/navigation";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileIdRedirectPage({ params }: ProfileIdPageProps) {
  const { id } = await params;
  redirect(`/u/${id}`);
}
