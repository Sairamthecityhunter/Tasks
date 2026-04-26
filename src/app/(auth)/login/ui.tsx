"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(fd.get("email")),
            password: String(fd.get("password")),
          }),
        });
        setBusy(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr((j as { error?: string }).error ?? "Sign in failed");
          return;
        }
        router.push("/projects");
        router.refresh();
      }}
    >
      {err && <p className="rounded border border-rose-500/30 bg-rose-950/30 px-2 py-1.5 text-xs text-rose-200">{err}</p>}
      <div>
        <label className="text-xs text-[var(--muted)]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-[var(--accent)] py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Sign in"}
      </button>
    </form>
  );
}
