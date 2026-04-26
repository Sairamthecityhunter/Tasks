import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/projectAccess";
import { prisma } from "@/lib/prisma";
import { ProjectBoard } from "@/components/ProjectBoard";
import { InviteForm } from "./invite";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Props) {
  const s = await getSessionFromCookies();
  if (!s) redirect("/login");
  const { id: projectId } = await params;

  const project = await assertProjectAccess(s.sub, projectId);
  if (!project) notFound();

  const [issues, members, owner] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true } },
      },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: project.ownerId },
      select: { name: true, email: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-2 text-xs">
        <Link href="/projects" className="text-[var(--muted)] hover:text-[var(--accent)]">
          ← All projects
        </Link>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">
            <span className="font-mono text-[var(--accent)]">{project.key}</span> {project.name}
          </h1>
          {project.description && <p className="mt-1 text-sm text-[var(--muted)]">{project.description}</p>}
          <p className="mt-1 text-xs text-[var(--faint)]">
            Project lead: {owner?.name} ({owner?.email})
          </p>
        </div>
        <div className="w-full sm:max-w-xs shrink-0 space-y-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Team on this project</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-[var(--text)]">
              {members.map((m) => (
                <li key={m.userId} className="flex justify-between gap-2">
                  <span>{m.user.name}</span>
                  <span className="text-[var(--faint)] truncate max-w-[140px]">{m.user.email}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <InviteForm projectId={projectId} isOwner={project.ownerId === s.sub} />
            </div>
          </div>
        </div>
      </div>
      <ProjectBoard
        projectId={projectId}
        projectKey={project.key}
        members={members.map((m) => m.user)}
        initial={issues.map((i) => ({
          id: i.id,
          number: i.number,
          title: i.title,
          description: i.description,
          status: i.status,
          priority: i.priority,
          sortOrder: i.sortOrder,
          assignee: i.assignee,
          reporter: i.reporter,
        }))}
      />
    </div>
  );
}
