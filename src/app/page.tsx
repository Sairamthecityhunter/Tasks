import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = await getSessionFromCookies();
  if (s) redirect("/projects");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Internal task board
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Work like Jira, without the bloat</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Create projects, assign work to people on your team, and move tasks across columns. Host it inside your
          company network or behind a single sign-on later — start with accounts on this app.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
          <li>· Projects with short keys (e.g. APP-12)</li>
          <li>· Kanban: Backlog → Done</li>
          <li>· Invite people to a project by email (after they register)</li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)]/50"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-8 text-xs text-[var(--faint)]">
          Demo data: run <code className="rounded bg-[var(--card)] px-1 py-0.5 font-mono">npx prisma db seed</code> to
          load a sample project, then use <code className="rounded bg-[var(--card)] px-1 font-mono">you@company.com</code>{" "}
          / <code className="rounded bg-[var(--card)] px-1 font-mono">changeme-please</code> after seeding.
        </p>
      </div>
    </div>
  );
}
