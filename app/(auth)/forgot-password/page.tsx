import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthGateEnabled } from "@/lib/auth/gate";
import { ForgotPasswordForm } from "../_components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  if (!isAuthGateEnabled()) redirect("/beta");
  return <ForgotPasswordForm />;
}
