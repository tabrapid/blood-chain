"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "donor" | "hospital" | "blood_center";

const ROLE_META: Array<{ role: Role; label: string; path: string }> = [
  { role: "donor", label: "Donor", path: "/donor" },
  { role: "hospital", label: "Hospital", path: "/hospital" },
  { role: "blood_center", label: "Blood Center", path: "/blood-center" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<Role>("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const roleQuery = searchParams.get("role");
    const emailQuery = searchParams.get("email");

    if (roleQuery === "donor" || roleQuery === "hospital" || roleQuery === "blood_center") {
      setRole(roleQuery);
    }
    if (emailQuery) {
      setEmail(emailQuery.trim().toLowerCase());
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email: email.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Login xatoligi");

      const targetPath = ROLE_META.find((r) => r.role === role)?.path ?? "/";
      router.push(targetPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login xatoligi";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.8)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold">Login</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Role tanlang va email/password bilan kirish qiling.
        </p>

        <form onSubmit={handleLogin} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {ROLE_META.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            disabled={submitting}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(190,24,54,0.95)] hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Kirish..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

