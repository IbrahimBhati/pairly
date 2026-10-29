import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { fetchVerificationStatusAction } from "@/lib/actions/safety";
import { VerificationView } from "./verification-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { isVerified, latestRequest } = await fetchVerificationStatusAction();

  return (
    <VerificationView
      isVerified={isVerified}
      initialRequest={latestRequest || null}
      userEmail={user.email}
      userId={user.id}
    />
  );
}
