"use client";

import { useState, useId } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  rectIntersection,
} from "@dnd-kit/core";
import { ISSUE_STATUSES, type IssueStatusId } from "@/lib/issues";

type Member = { id: string; name: string; email: string };
type IssueRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  sortOrder: number;
  assignee: Member | null;
  reporter: { id: string; name: string };
};

type Props = {
  projectId: string;
  projectKey: string;
  initial: IssueRow[];
  members: Member[];
};

const priorityClass: Record<string, string> = {
  CRITICAL: "bg-rose-500/20 text-rose-200",
  HIGH: "bg-amber-500/20 text-amber-200",
  MEDIUM: "bg-sky-500/20 text-sky-200",
  LOW: "bg-zinc-500/20 text-zinc-300",
};

function Column({
  id,
  label,
  count,
  children,
  color,
}: {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
  color: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}` });
  return (
    <div className="flex w-[min(100%,280px)] shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--col-bg)]/80 min-h-[120px]">
      <div
        className={`border-b border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wider ${color}`}
      >
        {label}
        <span className="ml-1.5 font-mono text-[var(--faint)]">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 p-2 min-h-[80px] ${isOver ? "ring-1 ring-[var(--accent)]/50" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function IssueCard({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id, disabled });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-[var(--border)] bg-[var(--card)] p-2.5 text-left shadow-sm transition ${
        isDragging ? "z-20 opacity-60 ring-1 ring-[var(--accent)]" : "hover:border-[var(--accent)]/40"
      }`}
    >
      {children}
    </div>
  );
}

export function ProjectBoard({ projectId, projectKey, initial, members }: Props) {
  const [issues, setIssues] = useState<IssueRow[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const formId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const active = activeId ? issues.find((i) => i.id === activeId) : null;

  async function patchIssue(issueId: string, body: object) {
    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Update failed");
    }
    return res.json() as Promise<{ issue: IssueRow }>;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overStr = String(over.id);
    if (!overStr.startsWith("col-")) return;
    const newStatus = overStr.replace("col-", "") as IssueStatusId;
    if (!ISSUE_STATUSES.some((s) => s.id === newStatus)) return;
    const issueId = String(active.id);
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;
    if (newStatus === issue.status) return;
    const inCol = issues
      .filter((i) => i.status === newStatus && i.id !== issueId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const last = inCol[inCol.length - 1];
    const sortOrder = last ? last.sortOrder + 1 : 1;
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: newStatus, sortOrder } : i)));
    patchIssue(issueId, { status: newStatus, sortOrder })
      .then((data) => {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, ...data.issue } : i)));
      })
      .catch((err) => {
        setMsg(err instanceof Error ? err.message : "Could not move card");
        setIssues(initial);
      });
  }

  return (
    <div>
      {msg && (
        <p className="mb-3 rounded border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {msg}
          <button type="button" className="ml-2 underline" onClick={() => setMsg(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-[var(--text)]">
          {projectKey} <span className="text-[var(--muted)] font-normal">board</span>
        </h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Create task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ISSUE_STATUSES.map((s) => {
            const col = issues
              .filter((i) => i.status === s.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <Column key={s.id} id={s.id} label={s.label} count={col.length} color="text-[var(--muted)]">
                {col.map((issue) => (
                  <IssueCard key={issue.id} id={issue.id}>
                    <div className="text-[10px] font-mono text-[var(--faint)]">
                      {projectKey}-{issue.number}
                    </div>
                    <div className="mt-0.5 text-sm font-medium leading-snug text-[var(--text)]">
                      {issue.title}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          priorityClass[issue.priority] ?? "bg-zinc-500/20"
                        }`}
                      >
                        {issue.priority}
                      </span>
                      {issue.assignee && (
                        <span className="text-[10px] text-[var(--muted)]">
                          {issue.assignee.name}
                        </span>
                      )}
                    </div>
                  </IssueCard>
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay>
          {active ? (
            <div className="w-[260px] cursor-grabbing rounded-md border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-xl">
              <div className="text-[10px] font-mono text-[var(--faint)]">
                {projectKey}-{active.number}
              </div>
              <div className="text-sm font-medium text-[var(--text)]">{active.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
            <h2 className="text-base font-semibold text-[var(--text)]">New task</h2>
            <form
              className="mt-3 space-y-3"
              onSubmit={async (ev) => {
                ev.preventDefault();
                setMsg(null);
                const fd = new FormData(ev.currentTarget);
                const title = String(fd.get("title") ?? "").trim();
                const description = String(fd.get("description") ?? "");
                const status = String(fd.get("status") ?? "TODO");
                const priority = String(fd.get("priority") ?? "MEDIUM");
                const assigneeId = String(fd.get("assigneeId") ?? "");
                if (!title) {
                  setMsg("Title is required");
                  return;
                }
                const res = await fetch(`/api/projects/${projectId}/issues`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title,
                    description,
                    status,
                    priority,
                    assigneeId: assigneeId && assigneeId !== "_none" ? assigneeId : null,
                  }),
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  setMsg((j as { error?: string }).error ?? "Could not create task");
                  return;
                }
                const data = (await res.json()) as { issue: IssueRow };
                setIssues((p) => [...p, data.issue]);
                setOpen(false);
              }}
            >
              <div>
                <label className="text-xs text-[var(--muted)]" htmlFor={`${formId}-title`}>
                  Title
                </label>
                <input
                  id={`${formId}-title`}
                  name="title"
                  required
                  className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]" htmlFor={`${formId}-desc`}>
                  Description
                </label>
                <textarea
                  id={`${formId}-desc`}
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm text-[var(--text)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--muted)]" htmlFor={`${formId}-st`}>
                    Column
                  </label>
                  <select
                    id={`${formId}-st`}
                    name="status"
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm"
                  >
                    {ISSUE_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]" htmlFor={`${formId}-pr`}>
                    Priority
                  </label>
                  <select
                    id={`${formId}-pr`}
                    name="priority"
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm"
                  >
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]" htmlFor={`${formId}-as`}>
                  Assignee
                </label>
                <select
                  id={`${formId}-as`}
                  name="assigneeId"
                  className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm"
                >
                  <option value="_none">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
