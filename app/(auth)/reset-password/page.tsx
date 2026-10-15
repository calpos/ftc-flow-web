import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "../_components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
};

// Reached from the reset email via /auth/callback, which signs the user in
// first. Without a session there is no account to update.
export default async function ResetPasswordPage() {
  if (!isAuthGateEnabled()) redirect("/beta");
  if (!(await getCurrentUser())) redirect("/forgot-password");
  return <ResetPasswordForm />;
}
