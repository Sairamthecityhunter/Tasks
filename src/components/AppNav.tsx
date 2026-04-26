"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { name: string; email: string };

export function AppNav({ name, email }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <header className="border-b border-[var(--border)] bg-[var(--nav)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link href="/projects" className="text-sm font-semibold tracking-tight text-[var(--text)]">
            Team Tasks
          </Link>
          <span className="text-xs text-[var(--muted)]">/ company task board</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-[var(--muted)]">
            {name} <span className="text-[var(--faint)]">({email})</span>
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--text)] transition hover:border-[var(--accent)] hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
