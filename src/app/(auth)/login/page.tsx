import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { LoginForm } from "./ui";

export default async function LoginPage() {
  const s = await getSessionFromCookies();
  if (s) redirect("/projects");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h1 className="text-center text-lg font-semibold text-[var(--text)]">Sign in</h1>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">Team Tasks — your company board</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
