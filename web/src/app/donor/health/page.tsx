"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type LabResult = {
  id: string;
  test_type: string | null;
  hemoglobin: number | null;
  blood_pressure: string | null;
  leukocytes: number | null;
  platelets: number | null;
  hiv: string | null;
  hepatitis_b: string | null;
  hepatitis_c: string | null;
  syphilis: string | null;
  created_at: string;
};

export default function DonorHealthPage() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/donor/lab-results", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");
        setResults(json.results ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ma’lumot yuklanmadi";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const latest = results[0];
  const hemoOk = (latest?.hemoglobin ?? 0) >= 120;
  const hivOk = (latest?.hiv ?? "").toLowerCase() === "negative";

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Salomatlik</h1>
      <div className="app-card">
        <h3>Analizlar</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Gemoglobin, infeksiya skriningi va AI tavsiyalar shu bo&apos;limda jamlanadi.</p>
        {latest ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#E3F2FD] p-3 text-sm dark:bg-blue-950/30 dark:text-blue-100">
              Gemoglobin: {latest.hemoglobin ?? "-"} g/L · {hemoOk ? "Me'yorida" : "Past"}
            </div>
            <div className="rounded-xl bg-[#C8E6C9] p-3 text-sm dark:bg-green-950/30 dark:text-green-100">
              HIV: {latest.hiv ?? "-"} · {hivOk ? "Xavfsiz" : "Pozitiv"}
            </div>
            <div className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800 dark:text-zinc-200">
              Leukotsitlar: {latest.leukocytes ?? "-"}
            </div>
            <div className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800 dark:text-zinc-200">
              Trombotsitlar: {latest.platelets ?? "-"}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Hali analiz natijalari yo'q.</div>
        )}
        <button className="btn-secondary mt-4 w-full">PDF export</button>
      </div>
    </div>
  );
}
