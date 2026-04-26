import Link from "next/link";
import { getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewProject } from "./ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const s = await getSessionFromCookies();
  if (!s) return null;

  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: s.sub }, { members: { some: { userId: s.sub } } }] },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { issues: true } } },
  });

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-[var(--muted)]">Open a project to see the board. Keys appear on issues (e.g. APP-1).</p>
        </div>
        <NewProject />
      </div>
      <ul className="mt-6 space-y-2">
        {projects.length === 0 && (
          <li className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            No projects yet. Create one above.
          </li>
        )}
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left transition hover:border-[var(--accent)]/40"
            >
              <div>
                <div className="font-mono text-sm font-semibold text-[var(--accent)]">{p.key}</div>
                <div className="text-sm text-[var(--text)]">{p.name}</div>
                {p.description && <p className="mt-0.5 text-xs text-[var(--muted)] line-clamp-2">{p.description}</p>}
              </div>
              <span className="shrink-0 text-xs text-[var(--faint)]">{p._count.issues} tasks</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
