"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";

export default function LogoutButton() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  async function onLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout xatoligi");
      window.location.href = "/";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Logout xatoligi";
      toast.error(message);
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        Logout
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      Logout
    </button>
  );
}

