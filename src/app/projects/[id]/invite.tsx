"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { projectId: string; isOwner: boolean };

export function InviteForm({ projectId, isOwner }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOwner) {
    return <p className="text-xs text-[var(--faint)]">Only the project lead can invite people by email.</p>;
  }

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: String(fd.get("email") ?? "") }),
        });
        setBusy(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr((j as { error?: string }).error ?? "Could not add");
          return;
        }
        (e.currentTarget as HTMLFormElement).reset();
        setMsg("Added to project.");
        router.refresh();
      }}
    >
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      {err && <p className="text-xs text-rose-300">{err}</p>}
      <label className="text-xs text-[var(--muted)]" htmlFor="invite-email">
        Invite by email
      </label>
      <p className="text-[10px] text-[var(--faint)]">They must register first, then you can add their address here.</p>
      <div className="mt-1 flex gap-1">
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "Add"}
        </button>
      </div>
    </form>
  );
}
