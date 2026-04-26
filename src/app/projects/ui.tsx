"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewProject() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]/50"
      >
        + New project
      </button>
    );
  }

  return (
    <form
      className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--col-bg)] p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(fd.get("name")),
            key: String(fd.get("key")).toUpperCase().replace(/[^A-Z0-9]/g, ""),
            description: String(fd.get("description") ?? ""),
          }),
        });
        setBusy(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr((j as { error?: string }).error ?? "Could not create");
          return;
        }
        setOpen(false);
        router.refresh();
      }}
    >
      {err && <p className="mb-2 text-xs text-rose-300">{err}</p>}
      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs text-[var(--muted)]" htmlFor="np-name">
            Name
          </label>
          <input
            id="np-name"
            name="name"
            required
            className="mt-0.5 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]" htmlFor="np-key">
            Key
          </label>
          <input
            id="np-key"
            name="key"
            required
            placeholder="e.g. APP"
            className="mt-0.5 w-full font-mono uppercase rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]" htmlFor="np-desc">
            Description (optional)
          </label>
          <input
            id="np-desc"
            name="description"
            className="mt-0.5 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5"
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          className="text-xs text-[var(--muted)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-[var(--accent)] px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "Create"}
        </button>
      </div>
    </form>
  );
}
