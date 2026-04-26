import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const s = await getSessionFromCookies();
  if (!s) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <AppNav name={s.name} email={s.email} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
