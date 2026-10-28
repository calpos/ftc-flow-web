import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthGateEnabled, safeNext } from "@/lib/auth/gate";
import { LoginForm } from "../_components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!isAuthGateEnabled()) redirect("/beta");
  const { next, mode, error } = await searchParams;

  return (
    <LoginForm
      next={safeNext(next)}
      initialMode={mode === "signup" ? "signup" : "signin"}
      linkError={error === "link"}
    />
  );
}
