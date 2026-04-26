import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { RegisterForm } from "./ui";

export default async function RegisterPage() {
  const s = await getSessionFromCookies();
  if (s) redirect("/projects");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h1 className="text-center text-lg font-semibold text-[var(--text)]">Create your account</h1>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">Everyone in your org registers here first</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Already have one?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
